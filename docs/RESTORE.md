# Restore runbook — playwolf.net

Three scenarios, documented separately because the procedures genuinely differ. Do not try
to generalize between them; pick the one that matches and follow it.

| Scenario                              | Situation                                                | Typical time |
| ------------------------------------- | -------------------------------------------------------- | ------------ |
| [A](#scenario-a--one-deleted-artwork) | One artwork deleted by accident                          | 10–20 min    |
| [B](#scenario-b--full-database-loss)  | Database corrupt, dropped, or wrecked by a bad migration | 30–60 min    |
| [C](#scenario-c--total-host-loss)     | Proxmox host gone. Rebuild from nothing                  | 2–4 h        |

Backup design and schedules: [BACKUP.md](BACKUP.md). Infrastructure: [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 0. Before you touch anything

Five minutes here saves hours later.

1. **Stop the clock on further damage.** If something is actively deleting data, put the
   site in maintenance mode (`siteSettings` toggle in `/admin`) or stop the web container:
   `docker stop <web-container>`. A restore into a live, writing system is a second incident.

2. **Do not let the backup jobs overwrite the evidence.** The daily object copy is safe by
   design — it never deletes, so it cannot propagate a deletion offsite
   ([BACKUP.md §5.1](BACKUP.md#51-the-copy-command--copy-not-sync)). The two jobs that _can_
   remove things are the monthly reclaim (option B) and the provider's lifecycle rule
   (option A). Stop what you can and note what you cannot:

```bash
systemctl stop playwolf-media-reclaim.timer   # the only job that removes objects
systemctl stop playwolf-weekly-dump.timer     # keeps the dump ladder from rolling forward
```

Also pause the Coolify backup schedule in the UI, so a fresh dump of the broken state does
not push a good one out of the retention window. A provider lifecycle rule cannot be
paused from here; it does not matter for an incident you are handling today, because its
window is 120 days.

Leave `playwolf-media-copy.timer` running. It only adds.

Re-enable everything at the end — there is a reminder in every scenario.

3. **Take a snapshot of the current broken state before changing it.** It is free, and it is
   the only way back if the restore makes things worse:

```bash
qm snapshot 120 pre-restore-$(date +%Y%m%d-%H%M)
```

4. **Start a timeline.** Note the time, what you observed, and what you do. During the
   incident it feels like overhead; afterwards it is the only record of what happened.

5. **Confirm what you actually have** before planning around it:

```bash
rclone lsl offsite:playwolf-backup/postgres/ | tail -5
rclone lsl offsite:playwolf-backup/postgres-weekly/ | tail -5
rclone lsf offsite:playwolf-backup/media-archive/ | tail -10
ls -lh /var/backups/playwolf/
```

---

## Scenario A — One deleted artwork

**Situation.** An artwork (or a character, or a media item) was deleted in the Payload admin
and should not have been. Everything else is fine and the site is up.

**Approach.** Do not restore the database. Restoring the whole database to recover one row
would discard every legitimate edit made since the backup — a much larger loss than the one
you are fixing. Instead: pull the object back from the offsite archive, read the row's
values out of a _scratch_ copy of the dump, and re-create the document through the admin UI.

### A.1 Establish what was lost and when

You need the media filename or the artwork slug, and the approximate deletion time. If you
have neither, the container logs from around that time will have the request:

```bash
docker logs <web-container> --since '6h' 2>&1 | grep -iE 'delete|artwork|media'
```

### A.2 Recover the object from the offsite copy

**The object is still in `offsite:playwolf-backup/media/`.** The daily job is an `rclone copy`
that never deletes, so a deletion in Garage is not propagated to the backup — that is the
whole reason it is a `copy` ([BACKUP.md §5.1](BACKUP.md#51-the-copy-command--copy-not-sync)).
No archive spelunking required, and no race against the next sync:

```bash
rclone lsf offsite:playwolf-backup/media/ --recursive | grep -i '<partial-filename>'
```

Two cases where it will not be there:

- **The deletion was more than 120 days ago** and the retention window has closed
  ([BACKUP.md §5.4](BACKUP.md#54-retention-and-pruning-for-objects)). Under option A, look for
  a noncurrent version through the provider's console. Under option B, it is gone.
- **You are running option B and the monthly reclaim has run since the deletion.** The object
  was relocated rather than deleted, so it is in the dated archive:

```bash
rclone lsf offsite:playwolf-backup/media-archive/ --recursive | grep -i '<partial-filename>'
```

Pull it to a working directory and inspect it before pushing anything anywhere:

```bash
mkdir -p /tmp/restore-a
rclone copy "offsite:playwolf-backup/media/<key>" /tmp/restore-a/
ls -lh /tmp/restore-a/
file /tmp/restore-a/*        # confirm it is the image you expect, at full size
```

### A.3 Read the original metadata from a scratch database

Do **not** restore the dump over the live database. Load it into a throwaway Postgres
container instead, purely to read values out of it.

```bash
# Newest daily dump, from the local copy if there is one
LATEST=$(ls -t /var/backups/playwolf/*.dump | head -1)
# ...or fetch from offsite:
#   rclone copy "offsite:playwolf-backup/postgres/<file>" /tmp/restore-a/

docker run -d --name pg-scratch \
  -e POSTGRES_PASSWORD=scratch -e POSTGRES_DB=scratch \
  postgres:16-alpine
sleep 8

docker cp "$LATEST" pg-scratch:/tmp/dump
docker exec pg-scratch pg_restore -U postgres -d scratch \
  --no-owner --no-privileges /tmp/dump
```

Then read the rows. Exact table and column names come from the generated Payload schema —
`\dt` lists them:

```bash
docker exec -it pg-scratch psql -U postgres -d scratch
```

```sql
\dt
SELECT id, title, slug, created_at FROM artworks WHERE slug = '<slug>';
SELECT * FROM media WHERE filename ILIKE '%<partial-filename>%';
-- Relationships live in join tables; find the ones referencing this artwork:
SELECT * FROM artworks_rels WHERE parent_id = <artwork-id>;
```

Copy the field values into your notes: title, slug, artist, character, profile, tags,
`featuring` entries, sort order, and the media dimensions.

### A.4 Re-create through the admin UI

**Re-upload and re-enter rather than doing SQL surgery.** It is tempting to `INSERT` the rows
straight back, and it is a trap: Payload owns ID sequences, join tables for every
relationship, upload metadata, and the derivative records. Hand-written inserts miss at
least one of those and leave a document that looks right in `psql` and misbehaves in the
admin. Re-entering a single artwork takes a few minutes and produces a correct document.

1. Log in to `/admin`.
2. Media collection → upload `/tmp/restore-a/<file>` — the original bytes you recovered, not
   a re-export. Payload regenerates the derivatives with sharp.
3. Artworks collection → create, filling in the values from A.3.
4. Re-attach the `featuring` entries and tags.
5. Load the public page. Confirm the image renders, the "Open full image" link resolves, and
   the artwork appears in the character's gallery and in any tag facets it belonged to.

### A.5 Clean up and re-arm

```bash
docker rm -f pg-scratch
rm -rf /tmp/restore-a

systemctl start playwolf-media-reclaim.timer
systemctl start playwolf-weekly-dump.timer
# Re-enable the Coolify backup schedule in the UI.
```

Run the object copy once by hand so the re-uploaded object — which has a new key — is
protected without waiting for tonight's run:

```bash
systemctl start playwolf-media-copy.service
```

Add a line to the [drill log](#d4-drill-log) with the elapsed time. A real recovery is a
better data point than a rehearsal, and it is the only chance you get to record one.

---

## Scenario B — Full database loss

**Situation.** Postgres is corrupt, the database was dropped, or a migration wrecked the
schema. The VM, Coolify, and Garage are all fine — **the objects are intact**, which is what
makes this recoverable to a clean state rather than a partial one.

**Approach.** Restore the newest good dump into the existing Postgres resource. Objects are
not touched. Accept the data loss between the dump and now: content added since the last
backup must be re-entered, and you can identify what that is because the objects for it are
still sitting in Garage.

### B.1 Stop the application

The app must not be writing during the restore, and it must not be reading a half-restored
schema.

```bash
docker stop <web-container>
```

Leave Postgres and Garage running.

### B.2 Choose the dump

Newest first, but **if the cause was corruption rather than a clean failure, do not
reflexively take the newest** — it may contain the corruption. Walk back to the last dump
you can reason about being good, using the weekly ladder if needed.

```bash
ls -lht /var/backups/playwolf/
rclone lsl offsite:playwolf-backup/postgres/ | sort -k2 | tail -5
rclone lsl offsite:playwolf-backup/postgres-weekly/ | sort -k2 | tail -8
```

Fetch it and verify it parses **before** dropping anything:

```bash
mkdir -p /tmp/restore-b && cd /tmp/restore-b
rclone copy "offsite:playwolf-backup/postgres/<file>" .

# Custom-format dumps list a table of contents; plain SQL will error here.
pg_restore --list ./<file> | head -40
```

If `pg_restore --list` fails, the file is probably plain SQL. Check:

```bash
head -c 5 ./<file>          # "PGDMP" = custom format; "--" or "SET" = plain SQL
file ./<file>               # may report gzip — decompress first
```

Restore plain SQL with `psql -f` instead of `pg_restore`; the rest of the procedure is
unchanged. Coolify's dump format has varied across versions, so check rather than assume.

### B.3 Prove it restores, in a scratch container first

Skipping this step is how a bad dump turns one outage into two. It costs five minutes.

```bash
docker run -d --name pg-scratch \
  -e POSTGRES_PASSWORD=scratch -e POSTGRES_DB=scratch postgres:16-alpine
sleep 8
docker cp /tmp/restore-b/<file> pg-scratch:/tmp/dump
docker exec pg-scratch pg_restore -U postgres -d scratch \
  --no-owner --no-privileges --exit-on-error /tmp/dump && echo "DUMP IS GOOD"

# Sanity-check the contents, not just that it loaded
docker exec -it pg-scratch psql -U postgres -d scratch -c '\dt'
docker exec -it pg-scratch psql -U postgres -d scratch \
  -c 'SELECT count(*) FROM artworks;' \
  -c 'SELECT count(*) FROM media;' \
  -c 'SELECT count(*) FROM users;'
```

Row counts in the right ballpark? Proceed. `users` returning 0 means you will be locked out
of the admin after the restore — pick a different dump.

### B.4 Restore into production

```bash
PG=$(docker ps --format '{{.Names}}' | grep -m1 '^postgresql-')
docker cp /tmp/restore-b/<file> "$PG":/tmp/dump
```

Take a dump of the broken database first — corrupt data is still evidence, and occasionally
it holds rows the backup does not:

```bash
docker exec "$PG" pg_dump -U playwolf -d playwolf --format=custom \
  > /var/backups/playwolf/pre-restore-broken-$(date +%Y%m%d-%H%M).dump
```

Then restore. `--clean --if-exists` drops existing objects as it goes, which is what you want
when replacing a wrecked schema:

```bash
docker exec -i "$PG" pg_restore \
  -U playwolf -d playwolf \
  --clean --if-exists \
  --no-owner --no-privileges \
  --jobs 4 \
  --verbose \
  /tmp/dump
```

If `--clean` leaves debris behind (it will, if the schema was badly mangled), recreate the
database from scratch instead:

```bash
docker exec -i "$PG" psql -U playwolf -d postgres <<'SQL'
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'playwolf';
DROP DATABASE playwolf;
CREATE DATABASE playwolf OWNER playwolf;
SQL

docker exec -i "$PG" pg_restore -U playwolf -d playwolf \
  --no-owner --no-privileges --jobs 4 --verbose /tmp/dump
```

> `--jobs` only works with custom-format dumps and cannot be combined with `--single-transaction`.
> A handful of "does not exist, skipping" notices from `--if-exists` is normal. Errors
> mentioning missing _tables_ or failed constraints are not — stop and reassess.

### B.5 Bring the app back

```bash
docker start <web-container>
docker logs -f --tail 100 <web-container>
```

If the dump predates a schema migration that the deployed code expects, the app will fail on
boot with column-not-found errors. Run migrations against the restored database:

```bash
docker exec -it <web-container> node node_modules/payload/dist/bin/index.js migrate
```

(See DEPLOYMENT.md §10 — Payload's CLI needs `--disable-transpile` when driven through Bun.)

### B.6 Verify

- [ ] `https://playwolf.net` loads
- [ ] `/admin` login works with the pre-incident credentials
      _(if not, `PAYLOAD_SECRET` differs from the one in force when the dump was taken)_
- [ ] Character pages render with images. **You should see none broken.** Garage was never
      touched in this scenario, so every object the dump can reference is still live — and
      the backup ordering rule
      ([BACKUP.md §2](BACKUP.md#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes))
      is specifically designed so a dump cannot contain rows for objects that are missing.
      Broken images here therefore point at something other than the backup design: the wrong
      dump, a partial restore, or `S3_*` environment variables pointing at the wrong bucket.
      Check `rclone lsl garage:playwolf-media | grep <filename>` before concluding anything
      was lost.
- [ ] Tag and character facets return results
- [ ] Upload a test image and delete it — proves writes work end to end

### B.7 Reconcile the gap

The expected anomaly after any restore is **orphan objects** — files in Garage with no row
pointing at them, because the dump predates the upload. They are harmless in themselves, but
each one represents a piece of content that needs re-entering. That listing is your worklist:

```bash
docker exec -it <garage-container> /garage bucket info playwolf-media
rclone lsl garage:playwolf-media --max-age 48h
```

Anything there without a corresponding artwork in the admin needs re-creating through
`/admin`. Once you have, leave the now-superseded objects alone — do not hand-delete them
from Garage. They cost storage and nothing else, and deleting objects by hand is how the
backup and the database drift apart.

### B.8 Re-arm

```bash
rm -rf /tmp/restore-b
docker rm -f pg-scratch
systemctl start playwolf-media-reclaim.timer playwolf-weekly-dump.timer
```

Re-enable Coolify's schedule, then **take an immediate manual backup** so the restored state
is protected before the next scheduled window.

---

## Scenario C — Total host loss

**Situation.** The Proxmox host is gone — hardware failure, fire, theft. Nothing local
survives. You have offsite S3, the GitHub repository, and your password manager.

**Approach.** Two paths. Take the first if you have an off-host `vzdump`; it is much faster.
Fall back to the second otherwise.

### C.1 Path 1 — Restore the VM image (fastest, ~1 h)

Only viable if a `vzdump` archive exists somewhere other than the dead host
([BACKUP.md §6](BACKUP.md#6-tier-3--proxmox-vzdump)).

```bash
# On the replacement Proxmox host
rclone copy offsite:playwolf-backup/vzdump/ /var/lib/vz/dump/ --include 'vzdump-qemu-120-*'
ls -lh /var/lib/vz/dump/

qmrestore /var/lib/vz/dump/vzdump-qemu-120-<timestamp>.vma.zst 120 --storage local-lvm
```

Before starting it, confirm the CPU type survived the restore — this is the setting that
silently degrades sharp if it comes back as `kvm64`:

```bash
qm config 120 | grep -E '^(cpu|memory|cores|net0|agent)'
qm set 120 --cpu host      # if it is not already
qm start 120
```

Then jump to [C.3](#c3-roll-forward-to-the-newest-data). The VM image is up to a week old, so
the data on it is stale — the whole point of C.3 is replacing it with the newest backups.

### C.2 Path 2 — Rebuild from scratch (~3–4 h)

No usable VM image. Rebuild the platform from the deployment runbook, then load data.

1. **Provision.** [DEPLOYMENT.md §1–2](DEPLOYMENT.md#1-proxmox-vm) — new VM, `--cpu host`,
   2 vCPU / 4 GB / 40 GB, guest agent, **the same static IP** so the existing NPM proxy
   hosts keep working untouched.
2. **Coolify.** [§3](DEPLOYMENT.md#3-install-coolify) install and register the admin account.
3. **Proxy off.** [§4](DEPLOYMENT.md#4-disable-coolifys-proxy-critical) — set the server
   proxy to None/Custom **before deploying anything**, or Traefik will start and collide
   with the NPM setup.
4. **Reconnect GitHub.** [§5](DEPLOYMENT.md#5-wire-up-the-github-repository). A new GitHub
   App installation or a new deploy key; the old one died with the host.
5. **Recreate resources.** Postgres and Garage, same names, same fixed host ports as
   [§6.1](DEPLOYMENT.md#61-the-port-allocation) — the port table is the contract NPM depends
   on.
6. **Restore the secrets from your password manager.** `PAYLOAD_SECRET` in particular
   **must be the original value.** A new one invalidates every session and makes any
   encrypted field in the restored database unreadable. This is the step where an incomplete
   password manager entry turns a recoverable outage into permanent data loss.
7. **Deploy** from the `production` branch and confirm the container starts. It will fail to
   find content — expected, the database is empty.

### C.3 Roll forward to the newest data

Both paths converge here. **Objects first, then the database** — the reverse of the backup
order, and deliberately so. On the backup side the database goes first because it must not
capture references the object job has not caught up to
([BACKUP.md §2](BACKUP.md#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes)).
On the restore side the database goes _last_ for the mirrored reason: it is what makes
content visible, so loading it after the objects means the site is never briefly live with
rows pointing at files that have not landed yet. A slow object transfer then delays the site
coming up rather than putting up a broken one.

**Objects.** Recreate the Garage cluster layout and bucket per
[DEPLOYMENT.md §7](DEPLOYMENT.md#7-garage-object-storage) — including `layout assign` and
`layout apply`, without which Garage accepts nothing. Then push the backup back in. Note the
direction: offsite is now the _source_.

```bash
rclone copy offsite:playwolf-backup/media garage:playwolf-media \
  --transfers 8 --checkers 16 --fast-list \
  --log-file /var/log/playwolf/restore-media.log --log-level INFO \
  --stats 30s

# Garage should end up at least as large as the backup
rclone size offsite:playwolf-backup/media
rclone size garage:playwolf-media
```

`copy`, not `sync`, in this direction too — there is nothing in an empty Garage worth
deleting, and reaching for `sync` here is how the habit gets formed.

Restoring `media/` alone is sufficient in the normal case, because the copy job never deleted
from it. Two exceptions worth checking before you move on:

- **You are restoring an old dump — more than a month back — under option B.** The monthly
  reclaim may have relocated objects that dump still references. Overlay the archive folders
  dated _after_ the dump you are restoring:

```bash
rclone lsf offsite:playwolf-backup/media-archive/          # which dates exist
rclone copy offsite:playwolf-backup/media-archive/<date>/ garage:playwolf-media --fast-list
```

- **You are on option A (provider versioning).** Current versions are what `rclone copy`
  fetches, which is correct. You only need to reach for noncurrent versions if the
  verification below turns up a specific missing object.

For hundreds of megabytes this is minutes; for tens of gigabytes, plan for hours and run it
in `tmux`.

**Database.** Then, and only then, restore Postgres — the full procedure from
[B.2–B.5](#b2-choose-the-dump), pulling the dump from
`offsite:playwolf-backup/postgres/`. Verify it in a scratch container first, exactly as in
B.3.

### C.4 Reconnect the front door

The static IP means NPM's proxy hosts should already point at the right place. Confirm each
one:

```bash
# From the NPM host
curl -sI http://<VM_IP>:3000/  | head -n1
curl -sI http://<VM_IP>:3900/  | head -n1
```

Then re-check in the NPM UI, per [DEPLOYMENT.md §6](DEPLOYMENT.md#6-fixed-host-ports-and-nginx-proxy-manager):

- [ ] **Websocket support is ON** for `playwolf.net` — the admin panel needs it
- [ ] `client_max_body_size 64m` is present in the Advanced tab — large uploads fail without it
- [ ] The certificate is valid and Force SSL is on
- [ ] Scheme is `http` and the port matches the table

If the IP had to change, update every proxy host and every firewall rule that references it.

### C.5 Full verification

Run the whole [first-boot checklist](DEPLOYMENT.md#11-first-boot-checklist) again — every
item, not a subset. A rebuilt host has the same failure surface as a new one.

Then, specific to a restore:

- [ ] Admin login works with **pre-incident** credentials (proves `PAYLOAD_SECRET` matched)
- [ ] Artwork counts match roughly what you expect
- [ ] Images render on public pages — no broken thumbnails anywhere
- [ ] "Open full image" resolves to a full-size original
- [ ] A new upload works end to end (proves the Garage key and bucket permissions are right)
- [ ] Push-to-deploy fires from a trivial commit
- [ ] **Backups are reconfigured and one has completed successfully.** You are running
      without a net until this is true, and it is the step most likely to be forgotten in
      the relief of being back online.

### C.6 Afterwards

Write down what was slow, what was missing from the documentation, and what you had to
improvise. That is the most valuable output of a real incident and it evaporates within a
day. Update this file while it still stings.

---

## D. Restore rehearsal

**An untested backup is a hypothesis.** Everything above is theory until it has been run
against real backup files by a person following the written steps. Rehearse quarterly, and
after any significant change to the stack.

The rehearsal is not optional decoration — it is what converts "we have backups" into "we
can be back in ninety minutes", which is a completely different sentence to be able to say
during an outage.

### D.1 Rules of the drill

1. **Use a throwaway VM.** Never rehearse against production, and never against anything
   sharing production's Garage bucket or database. A drill that touches production is an
   outage with extra steps.
2. **Follow the written procedure literally.** Do not improvise from memory. The point is to
   test _the document_, not your recall. Every time you find yourself doing something the
   document does not say, that is a documentation bug — write it down and fix it after.
3. **Use the offsite copies only.** Pretend the local ones burned. That is the scenario that
   actually needs rehearsing.
4. **Time every phase.** Wall clock, written down, phase by phase. "It took a while" is not
   a recovery objective.
5. **Have someone else drive it, at least once a year.** The person who built the system is
   the worst tester of its documentation, because they fill gaps unconsciously.

### D.2 Setting up the throwaway VM

On the Proxmox host, clone the production VM's _settings_ — not its data:

```bash
# Fresh VM with production's shape, on an isolated bridge if you have one
qm create 199 \
  --name restore-drill \
  --ostype l26 \
  --cpu host --cores 2 --sockets 1 \
  --memory 4096 --balloon 0 \
  --machine q35 --scsihw virtio-scsi-single \
  --net0 virtio,bridge=vmbr0 \
  --agent enabled=1

qm set 199 --scsi0 local-lvm:40,discard=on,ssd=1
qm set 199 --ide2 local:iso/debian-12.11.0-amd64-netinst.iso,media=cdrom
qm set 199 --boot order='scsi0;ide2'
qm start 199
```

Give it a **different IP** from production (e.g. `10.10.10.99`) and do not point any NPM host
at it. Access it directly by IP and port during the drill.

> **The riskiest part of the drill is a stray `rclone sync` pushing the drill's empty bucket
> back over the offsite copy.** Prevent it structurally rather than by care: on the drill VM,
> configure the offsite remote with a **read-only** key — Backblaze and most providers can
> issue list-and-read-only application keys. Then the destructive command fails with a
> permissions error instead of succeeding. Do not rely on remembering to type the arguments
> in the right order at 1 a.m.

### D.3 Drill procedure

Time each phase and record it in the log below.

| #   | Phase                                                              | What you are proving                       |
| --- | ------------------------------------------------------------------ | ------------------------------------------ |
| 1   | Provision VM, install Debian, Docker, Coolify                      | DEPLOYMENT.md §1–3 is complete and correct |
| 2   | Set proxy to None, create Postgres + Garage resources              | §4, §6, §7 work as written                 |
| 3   | Deploy the app from the `production` branch                        | The build works from a clean checkout      |
| 4   | `rclone copy` objects **from** offsite **into** the drill's Garage | The object backup is complete and readable |
| 5   | Restore the newest Postgres dump                                   | The dump is valid and loads                |
| 6   | Verify: admin login, images render, upload works                   | The two halves are mutually consistent     |
| 7   | **Record elapsed time**, destroy the VM                            | You have a real RTO number                 |

Full-drill target: **under 4 hours**. Database-only (scenario B in isolation): **under
1 hour**. If a drill runs long, the fix is usually documentation, not infrastructure —
find the step where you stalled and write down what you had to figure out.

Destroy it afterwards, and actually do it — a half-configured drill VM with production
credentials on it is a liability:

```bash
qm stop 199 && qm destroy 199 --purge
```

### D.4 Drill log

Fill in a row each time. Keep the history — a drill time that is drifting upward means the
system is growing faster than the procedure accounts for, and that is worth knowing before
an incident rather than during one.

| Date         | Scenario | Who | Elapsed | Data size               | Notes / what broke | Doc fixes made |
| ------------ | -------- | --- | ------- | ----------------------- | ------------------ | -------------- |
| _YYYY-MM-DD_ | Full (C) |     | _h:mm_  | _N GB objects, N MB DB_ |                    |                |
|              |          |     |         |                         |                    |                |
|              |          |     |         |                         |                    |                |

Suggested cadence:

| When                   | Drill                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Quarterly              | Scenario B — database only, into the throwaway VM                                          |
| Annually               | Scenario C — full rebuild, ideally driven by someone else                                  |
| After any stack change | Whichever scenario the change touches                                                      |
| Monthly                | Not a drill: the integrity check in [BACKUP.md §7.3](BACKUP.md#73-monthly-integrity-check) |

### D.5 What a drill typically catches

Recorded here because these are the things that are _always_ found, and knowing them in
advance makes the first drill faster:

- A secret that is not in the password manager — usually `PAYLOAD_SECRET`
- The Garage `layout apply` step, skipped, producing baffling errors
- `client_max_body_size` missing, so uploads fail only for large files
- CPU type restored as `kvm64`, so sharp is quietly slow
- Coolify's proxy defaulting back to Traefik on a fresh install
- A dump format that changed after a Coolify upgrade, so `pg_restore` no longer applies
- The offsite bucket containing a copy that stopped updating months ago
- **Someone having "tidied up" the object job into an `rclone sync`, or added `--delete`.**
  This one is invisible in normal operation and shows up as objects missing from the backup
  that are still live in Garage. Check the daily job's command line at every drill; the
  size comparison in [BACKUP.md §7.2](BACKUP.md#72-weekly-eyeball) is the standing detector
  between drills

Every one of those is cheap to discover during a drill and expensive to discover during an
outage. That asymmetry is the entire argument for rehearsing.
