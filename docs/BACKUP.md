# Backup runbook — playwolf.net

What gets backed up, how, when, and — the part that is easy to get wrong — **in what order**.

Restoring is a separate document: [RESTORE.md](RESTORE.md). Deployment context:
[DEPLOYMENT.md](DEPLOYMENT.md).

---

## 1. What is backed up, and what deliberately is not

| Data                                                       | Where it lives                 | Backup method                               | Schedule             | Retention                                                                       |
| ---------------------------------------------------------- | ------------------------------ | ------------------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| **Postgres** — every character, artwork, tag, artist, user | Postgres container volume      | Coolify scheduled backup → offsite S3       | Daily 02:00          | 14 daily + 8 weekly (**≈56 days**)                                              |
| **Garage objects** — artwork originals and derivatives     | Garage bucket `playwolf-media` | `rclone copy` to offsite S3, never deleting | Daily 02:30          | **≥120 days** for anything deleted upstream — deliberately longer than Postgres |
| **Whole VM** — OS, Docker, Coolify config, drift           | Proxmox VM `<VMID>`            | `vzdump`                                    | Weekly, Sunday 03:30 | 3 weekly + 2 monthly                                                            |
| **Secrets** — `PAYLOAD_SECRET`, Garage keys, DB password   | Coolify env vars               | Password manager, by hand                   | On change            | Forever                                                                         |

Postgres is listed first because it _runs_ first. That ordering is not cosmetic — see
[section 2](#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes)
before changing either schedule.

### Redis is NOT backed up. On purpose.

If a Redis container exists on this host, **do not build a backup job for it.** It holds
sessions and cache only — data that is derived, disposable, and regenerated on demand.
Backing it up would preserve nothing of value and restoring it would at best re-hydrate a
stale cache.

The correct disaster-recovery action for Redis is: start an empty one. Users get logged out.
That is the entire impact.

(`docker-compose.yml` no longer defines Redis at all — Garage took its slot, and Payload
keeps its own sessions in Postgres. This note stays for hosts still running a Redis
container left over from an earlier deploy, and so nobody wonders later why there is no
Redis backup job.)

### Also not backed up

- **Docker images** — rebuilt from GitHub, or pulled from `ghcr.io`
- **`/app/.next/cache`** — the image-optimizer cache. Regenerated on demand; only affects
  the first few page loads after a restore
- **Application code** — it is in Git. GitHub is the backup. (If you want protection from
  GitHub itself, `git clone --mirror` to a local disk occasionally.)

---

## 2. The ordering rule: Postgres first, then objects — and the object backup never deletes

**Dump Postgres first. Copy the Garage objects second. Never let the object job delete
anything.** All three clauses are load-bearing; the first two on their own are not safe, and
neither is the third.

The database stores rows that point at object keys. The two jobs cannot run simultaneously,
so _something_ can always change in the gap between them, and the whole question is which
anomaly you are willing to allow. Work through the three that are possible.

**Upload in the gap, objects first then DB — broken.** Object sync at 02:00, dump at 02:30,
an artwork uploaded at 02:15. The sync had already finished, so the object is not in the
backup. The dump ran afterwards, so the row _is_. Restoring that pair gives you a row
referencing a file that exists in no backup anywhere. **This is the failure that has no
recovery**, and it is the routine one, because uploading is the thing that happens most.

**Upload in the gap, DB first then objects — harmless.** Reverse the times. The 02:00 dump
missed the row; the 02:30 copy caught the object. Restoring gives you an object nothing
references — a few wasted megabytes, invisible to the site.

**Deletion in the gap, DB first then objects — broken, but only if the job deletes.** Dump
at 02:00 captures the row; the artwork is deleted at 02:15; the object job runs at 02:30. If
that job is an `rclone sync`, it faithfully mirrors the deletion and removes the object from
the backup, leaving a dump row with no file. But this failure is entirely a property of the
_job_, not of the ordering — it only exists because the object job was given permission to
delete. Take that permission away and the failure disappears with it.

So the safe combination is **database first, then objects, with an object backup that only
ever adds.** That leaves exactly one residual anomaly:

> **Orphan objects — objects in the backup that no restored row references.** They are
> harmless. They cost storage and nothing else, no page renders differently because of them,
> and the pruning job in [5.4](#54-retention-and-pruning-for-objects) reclaims them on a
> lagging schedule. This is the entire remaining edge case, and it is benign by construction.

### Two rules that follow, and must not be "tidied up"

**Do not reverse the order.** Objects-first looks tidier — back up the big slow thing first,
then snapshot the database that points at it — and it is the ordering most people reach for.
It is wrong here for the reason above: it makes the _upload_ case, the common one,
unrecoverable.

**Do not re-add `--delete`.** Someone will eventually notice the offsite bucket holds objects
that are no longer in Garage and reach for `rclone sync` or `--delete` to "clean it up." That
single change reintroduces the deletion failure and does so silently — nothing breaks until
a restore months later. Reclaiming that space is the pruning job's business, and the pruning
job is deliberately built to lag ([5.4](#54-retention-and-pruning-for-objects)).

### How the order is enforced

Two mechanisms, because the two Postgres jobs are scheduled by different things.

1. **The daily pair — a scheduled gap, honestly.** Coolify owns the daily Postgres backup and
   its scheduler is a plain cron expression with no notion of dependencies, so there is
   nothing for the object job to declare a dependency _on_. Coolify's backup at
   **`0 2 * * *`**, object copy at **02:30**. This is a time gap and nothing stronger: if a
   dump ever runs long, the copy starts anyway. The gap must comfortably exceed the dump's
   normal runtime — check it ([section 7](#7-monitoring-and-verification)) and widen it if
   the dump approaches 30 minutes. Start here; it is adequate because the consequence of the
   two overlapping is an orphan object, not a broken row.
2. **The weekly pair — a real dependency.** Both halves are systemd units you control, so
   make it explicit rather than hoping about clocks. In
   `playwolf-weekly-dump.service`:

```ini
[Unit]
Before=playwolf-media-copy.service
Wants=playwolf-media-copy.service
```

The dependency is declared from the _earlier_ unit's side rather than as an
`After=playwolf-weekly-dump.service` on the copy unit, because the copy unit also runs
daily on its own timer and a `Requires=` there would drag the weekly dump into every daily
run.

`Wants=` rather than `Requires=` is deliberate. A hard dependency would be needed if a
half-completed pair were dangerous, but under this rule an object copy that runs after a
_failed_ dump is harmless — it only adds objects. The weaker dependency therefore costs
nothing, and it avoids a failed dump silently suppressing the object backup as well.

If the media library grows enough that the timing gets unpredictable, move the daily Postgres
backup off Coolify's scheduler onto a systemd unit as well and give the pair the same
`Before=`/`Wants=` treatment.

---

## 3. Offsite target

Everything lands on an S3 provider that is **not** this Proxmox host. Backblaze B2,
Hetzner Object Storage, Wasabi — any of them works. What matters:

- **Different physical location.** A backup on the same host is not a backup; it is a copy
  that dies in the same fire.
- **A dedicated, least-privilege key.** Scoped to the backup bucket. If you take
  [option A in 5.4](#54-retention-and-pruning-for-objects), the key needs **no delete
  permission at all** — issue it write-and-list only and let the provider's lifecycle rule be
  the only thing that can remove anything.
- **Object lock or versioning if available.** This is what turns the backup into
  ransomware protection instead of just hardware-failure protection. Without it, anything
  that can write to the bucket can also erase it.

Create one bucket, e.g. `playwolf-backup`, with these prefixes:

```
playwolf-backup/
├── media/            ← accumulating copy of the Garage bucket; nothing deletes from here
├── media-archive/    ← overwritten versions, and (option B only) objects removed
│                       upstream, filed by date and reaped after 120 days
├── postgres/         ← Coolify's daily dumps
├── postgres-weekly/  ← the weekly long-retention ladder
└── vzdump/           ← optional off-host copy of the weekly VM image
```

Note that `media/` is a superset of the live Garage bucket, not a mirror of it — it retains
objects that have since been deleted upstream. That is by design; see
[section 2](#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes).

### 3.1 rclone configuration

On the Coolify VM, `/root/.config/rclone/rclone.conf`:

```ini
[garage]
type = s3
provider = Other
access_key_id = <garage-access-key-id>
secret_access_key = <garage-secret-key>
endpoint = http://10.10.10.20:3900
region = garage
force_path_style = true

[offsite]
type = s3
provider = Backblaze
access_key_id = <offsite-key-id>
secret_access_key = <offsite-secret>
endpoint = s3.eu-central-003.backblazeb2.com
region = eu-central-003
```

`force_path_style = true` on the Garage remote is mandatory — Garage does not support
virtual-host-style addressing.

```bash
chmod 600 /root/.config/rclone/rclone.conf

# Verify both ends before scheduling anything
rclone lsd garage:
rclone lsd offsite:
rclone size garage:playwolf-media
```

### 3.2 Optional: encrypt at rest

If you do not want a third-party provider holding readable artwork, wrap the offsite remote
in `rclone crypt`:

```bash
rclone config   # → n) New remote → name: offsite-enc → type: crypt
                #   remote: offsite:playwolf-backup/media
                #   filename encryption: standard
```

Then copy to `offsite-enc:` instead of `offsite:playwolf-backup/media`.

> **If you encrypt, the crypt password and salt go in your password manager immediately.**
> Losing them destroys the backup as surely as deleting it. This is the single most common
> way people discover their backups are worthless.

---

## 4. Tier 1 — Postgres via Coolify's scheduled backups

**This tier runs first**, at 02:00, ahead of the object copy. That is the ordering rule in
[section 2](#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes);
do not reschedule either job without reading it.

Coolify has scheduled database backups with S3 upload built in. Use it rather than a custom
`pg_dump` cron: it is already wired to the container, it handles credentials, and it surfaces
success and failure in the UI where you will actually see them.

### 4.1 Configure the S3 destination

`Settings → S3 Storages → + Add`:

| Field      | Value                                       |
| ---------- | ------------------------------------------- |
| Name       | `offsite-backup`                            |
| Endpoint   | `https://s3.eu-central-003.backblazeb2.com` |
| Bucket     | `playwolf-backup`                           |
| Region     | `eu-central-003`                            |
| Access Key | offsite key ID                              |
| Secret Key | offsite secret                              |

Use the **Validate connection** button. A silently misconfigured destination is a backup
system that reports success and stores nothing.

### 4.2 Configure the backup job

Open the Postgres resource → `Backups` tab → **Add backup**:

| Field                | Value       | Why                                                                                                                                               |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frequency (cron)     | `0 2 * * *` | Runs **before** the object copy at 02:30 — see [section 2](#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes) |
| Backup all databases | On          | The instance holds `playwolf` and, if analytics is deployed, `umami`. Turn it off only if analytics is not running and never will be              |
| Save locally         | On          | A local copy makes scenario B restores fast; the offsite copy covers scenario C                                                                   |
| Upload to S3         | On          | Destination: `offsite-backup`                                                                                                                     |
| Retention (local)    | 7           | Disk is the constraint                                                                                                                            |
| Retention (S3)       | 14          |                                                                                                                                                   |

Click **Backup now** and confirm a dump appears both under the resource's backup list _and_
in the bucket:

```bash
rclone ls offsite:playwolf-backup/ --max-depth 3 | grep -i playwolf
```

### 4.3 Weekly long-retention copy

Coolify's retention is a rolling count, which protects against hardware failure but not
against slow corruption you notice a month later. Keep a small ladder of weekly copies:

`/usr/local/bin/playwolf-weekly-dump.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

PG_CONTAINER="$(docker ps --format '{{.Names}}' | grep -m1 '^postgresql-')"
STAMP="$(date -u +%Y-%m-%d)"
OUT="/var/backups/playwolf/playwolf-${STAMP}.dump"

mkdir -p /var/backups/playwolf

docker exec "$PG_CONTAINER" \
  pg_dump -U playwolf -d playwolf --format=custom --compress=9 \
  > "$OUT"

# Refuse to upload a truncated dump.
[ -s "$OUT" ] || { echo "empty dump, aborting" >&2; exit 1; }

rclone copy "$OUT" offsite:playwolf-backup/postgres-weekly/ --s3-no-check-bucket
find /var/backups/playwolf -name '*.dump' -mtime +21 -delete

curl -fsS -m 10 --retry 3 "https://hc-ping.com/<uuid-weekly>" >/dev/null || true
```

`/etc/systemd/system/playwolf-weekly-dump.service` — the `Before=`/`Wants=` pair is the
ordering rule from [section 2](#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes)
made explicit instead of left to the clock:

```ini
[Unit]
Description=Weekly long-retention Postgres dump
Before=playwolf-media-copy.service
Wants=playwolf-media-copy.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/playwolf-weekly-dump.sh
Nice=10
```

`Wants=` pulls the object copy into the same transaction and `Before=` guarantees the dump
finishes first, so the weekly pair is always database-then-objects no matter how long the
dump takes. [Section 2](#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes)
covers why the dependency is declared here rather than on the copy unit, and why it is
`Wants=` rather than `Requires=`.

`/etc/systemd/system/playwolf-weekly-dump.timer`:

```ini
[Unit]
Description=Weekly Postgres dump

[Timer]
OnCalendar=Sun *-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Sunday 03:00 sits after the daily pair and before `vzdump`. Prune the offsite weeklies to 8
with a provider lifecycle rule.

`--format=custom` matters: it is what lets `pg_restore --list` produce a readable table of
contents (the monthly integrity check in [7.3](#73-monthly-integrity-check)), what enables
parallel restore with `--jobs`, and what allows pulling out a single table with
`--table=`. A plain SQL dump gives you none of those.

### 4.4 Retention summary for Postgres

| Copy            | Where                              | Count | Covers                                     |
| --------------- | ---------------------------------- | ----- | ------------------------------------------ |
| Daily, local    | Coolify volume on the VM           | 7     | "I broke it an hour ago" — fastest restore |
| Daily, offsite  | `playwolf-backup/postgres/`        | 14    | Host loss                                  |
| Weekly, offsite | `playwolf-backup/postgres-weekly/` | 8     | Corruption noticed weeks later             |

Roughly two months of history for a database that will be a few hundred megabytes at most.

**The number to carry forward is ≈56 days** — eight weekly copies, the age of the oldest dump
you could still restore. [5.4](#54-retention-and-pruning-for-objects) sizes the object
retention window against it.

---

## 5. Tier 2 — Garage objects via `rclone copy`

**This tier runs second**, at 02:30, after the Postgres dump has completed.

The object store is append-mostly: originals are uploaded once and essentially never change.
Incremental copies therefore stay cheap even with hundreds of megabytes of originals — after
the first run, a daily pass transfers only what is new.

### 5.1 The copy command — `copy`, not `sync`

```bash
rclone copy garage:playwolf-media offsite:playwolf-backup/media \
  --backup-dir "offsite:playwolf-backup/media-archive/$(date -u +%Y-%m-%d)" \
  --transfers 8 \
  --checkers 16 \
  --fast-list \
  --s3-no-check-bucket \
  --log-file /var/log/playwolf/media-copy.log \
  --log-level INFO \
  --stats 1m \
  --stats-one-line
```

> **`copy`, never `sync`. No `--delete-during`, `--delete-after`, or `--delete-excluded`.**
> `rclone sync` makes the destination match the source exactly, which means propagating
> deletions — and a job that can delete is a job that turns a deletion landing in the backup
> window into a restored row with no file
> ([section 2](#2-the-ordering-rule-postgres-first-then-objects--and-the-object-backup-never-deletes)).
> `rclone copy` only ever adds and overwrites. **This job must have no path by which it can
> remove an object from the backup.** Reclaiming space belongs to
> [5.4](#54-retention-and-pruning-for-objects) and to nothing else.

`--backup-dir` still earns its place with `copy`, though it fires far less often: it catches
_overwrites_, moving the previous bytes into a dated archive prefix before the new ones land.
Payload normally writes a fresh key per upload rather than overwriting, so this is cheap
insurance against the cases where it does not.

`--fast-list` trades memory for far fewer list calls, which matters on per-request-billed
providers. `--transfers 8` is a reasonable default for a 2 vCPU VM; lower it if the copy
starves the site of bandwidth.

### 5.2 Wrap it in a script

`/usr/local/bin/playwolf-media-copy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_DIR=/var/log/playwolf
mkdir -p "$LOG_DIR"

STAMP="$(date -u +%Y-%m-%d)"

# copy, not sync: this job must never be able to delete. See BACKUP.md 5.1.
rclone copy garage:playwolf-media offsite:playwolf-backup/media \
  --backup-dir "offsite:playwolf-backup/media-archive/${STAMP}" \
  --transfers 8 --checkers 16 --fast-list --s3-no-check-bucket \
  --log-file "${LOG_DIR}/media-copy.log" --log-level INFO \
  --stats 1m --stats-one-line

# Ping a dead-man's switch so a job that stops running gets noticed.
curl -fsS -m 10 --retry 3 "https://hc-ping.com/<uuid-media>" >/dev/null || true
```

```bash
chmod 750 /usr/local/bin/playwolf-media-copy.sh
```

The script and unit are named `…-copy`, not `…-sync`, on purpose. The name is the last line
of defence against someone reaching for the tool the name implies.

### 5.3 Schedule it

`/etc/systemd/system/playwolf-media-copy.service`:

```ini
[Unit]
Description=Copy Garage objects offsite (never deletes)
After=docker.service
Wants=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/playwolf-media-copy.sh
Nice=10
IOSchedulingClass=idle
```

`/etc/systemd/system/playwolf-media-copy.timer`:

```ini
[Unit]
Description=Daily Garage object copy

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```bash
systemctl daemon-reload
systemctl enable --now playwolf-media-copy.timer
systemctl list-timers playwolf-media-copy.timer

# Run it once now and watch it
systemctl start playwolf-media-copy.service
journalctl -u playwolf-media-copy -f
```

`Persistent=true` means a run missed while the VM was down happens at next boot.
`IOSchedulingClass=idle` keeps the copy from competing with Postgres for disk.

`RandomizedDelaySec=300` is worth a moment's thought given the 02:00/02:30 pairing: it can
push the copy out to 02:35 but never earlier than 02:30, so it only ever widens the gap.
Do not replace it with anything that could skew the start time backwards.

### 5.4 Retention and pruning for objects

Because the daily job never deletes, the offsite mirror accumulates objects that are no longer
in Garage. That is intentional — it is what makes
[scenario A](RESTORE.md#scenario-a--one-deleted-artwork) a two-minute job — but something has
to reclaim the space eventually, on a schedule that lags far enough behind that it can never
remove an object a restorable dump might still reference.

**The sizing rule: object retention must be longer than the longest Postgres retention.** Any
dump you can still restore may contain rows pointing at objects that were deleted after that
dump was taken. If the object backup forgets faster than the database does, those restores
come up with broken images — the exact failure the ordering rule exists to prevent,
reintroduced through the back door of retention policy.

Postgres tops out at eight weekly copies, so the oldest restorable dump is **≈56 days** old
([4.4](#44-retention-summary-for-postgres)). Objects therefore get **120 days** — roughly
double, deliberately. The margin exists so that lengthening the Postgres weekly ladder later
does not silently invalidate the object window before anyone notices.

|                                     | Window       | Set by                                                      |
| ----------------------------------- | ------------ | ----------------------------------------------------------- |
| Oldest restorable Postgres dump     | ≈56 days     | 8 weekly copies ([4.4](#44-retention-summary-for-postgres)) |
| Object backup keeps deleted objects | **120 days** | Must exceed the above, with margin                          |

Pick one of the two implementations below.

**Option A — provider versioning and lifecycle (preferred).** If the offsite provider supports
it, enable versioning on `playwolf-backup` and add a lifecycle rule expiring noncurrent
versions after 120 days. Nothing on the VM then needs delete permission on the bucket at all,
so the offsite key can be write-and-list only — which additionally makes the backup resistant
to anything that compromises the VM. Restores stay simple, since everything remains under the
single `media/` prefix.

On Backblaze B2 this is `Lifecycle Settings → Keep prior versions for this many days: 120`.
Other S3-compatible providers express it as a `NoncurrentVersionExpiration` rule.

**Option B — a monthly reclaim job.** If the provider has no lifecycle support, run the
reclaim yourself: monthly, as a separate job with a deliberately different name.

`/usr/local/bin/playwolf-media-reclaim.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_DIR=/var/log/playwolf
mkdir -p "$LOG_DIR"
STAMP="$(date -u +%Y-%m-%d)"

# The only job permitted to remove anything from the object backup — and even
# this one does not delete from the mirror. --backup-dir relocates objects that
# have disappeared upstream into a dated archive folder; that relocation is what
# starts the retention clock running.
rclone sync garage:playwolf-media offsite:playwolf-backup/media \
  --backup-dir "offsite:playwolf-backup/media-archive/${STAMP}" \
  --transfers 8 --checkers 16 --fast-list --s3-no-check-bucket \
  --log-file "${LOG_DIR}/media-reclaim.log" --log-level INFO

# The single destructive step in the entire backup system. It touches only
# archive entries that have already sat out the full 120-day window.
rclone delete offsite:playwolf-backup/media-archive --min-age 120d
rclone rmdirs offsite:playwolf-backup/media-archive --leave-root

curl -fsS -m 10 --retry 3 "https://hc-ping.com/<uuid-reclaim>" >/dev/null || true
```

Schedule it monthly, nowhere near the daily pair:

```ini
[Timer]
OnCalendar=*-*-01 04:00:00
Persistent=true
```

Two things about this script, because it is the only place in this document where
`rclone sync` is actually invoked, and copying it into the daily job would undo the entire
design:

- The `sync` is safe **only** because of `--backup-dir`. It issues no deletes against
  `media/`; it moves vanished objects sideways into `media-archive/<date>/`, where they sit
  out the full window.
- The lag is the point. An object deleted from Garage today is relocated at the next monthly
  run and reaped 120 days after that — a minimum of 120 days of grace, comfortably past the
  56-day Postgres horizon.

Either option leaves the same residual state: some objects in the backup that no restored row
references. **Orphan objects are harmless.** They cost storage and change nothing else — no
page renders differently, no restore is impaired — and both options clear them on their own
schedule. That is the entire remaining edge case of this design, and it is the benign one, by
construction.

---

## 6. Tier 3 — Proxmox `vzdump`

The coarse net. It does not replace the two tiers above — restoring a whole VM image to
recover one artwork is absurd — but it captures everything the targeted jobs miss:
Coolify's own configuration, env vars, NPM-facing settings, installed packages, systemd
units, firewall rules. All the drift that accumulates and that nobody writes down.

On the **Proxmox host**, `Datacenter → Backup → Add`:

| Field        | Value                                |
| ------------ | ------------------------------------ |
| Storage      | A datastore not on the VM's own disk |
| Schedule     | `sun 03:30`                          |
| Selection    | VM `<VMID>`                          |
| Mode         | **Snapshot**                         |
| Compression  | ZSTD                                 |
| Retention    | Keep weekly 3, keep monthly 2        |
| Notification | On failure                           |

Or from the CLI:

```bash
vzdump 120 --mode snapshot --compress zstd --storage backup-nfs \
  --prune-backups 'keep-weekly=3,keep-monthly=2' --mailnotification failure
```

**Snapshot mode depends on the QEMU guest agent** being installed and running in the VM
(see DEPLOYMENT.md §2.2). With the agent, Proxmox freezes the guest filesystem for the
snapshot instant and the image is crash-consistent; without it you get a backup that may
capture Postgres mid-write. Verify:

```bash
qm agent 120 ping    # must succeed
```

**Get a copy off the Proxmox host too.** A weekly image that only exists on the same
hardware fails the one scenario it is there for. Either back up to an NFS/PBS target on
another machine, or `rclone copy` the newest dump offsite:

```bash
rclone copy /var/lib/vz/dump offsite:playwolf-backup/vzdump/ \
  --include 'vzdump-qemu-120-*' --max-age 8d --transfers 2
```

Schedule that copy on the Proxmox host with a cron entry an hour after the backup window,
and have it ping the dead-man's switch so a `vzdump` that quietly stops running gets noticed
([7.1](#71-dead-mans-switches)):

```bash
# /etc/cron.d/playwolf-vzdump-offsite  (on the Proxmox host)
30 5 * * 0 root rclone copy /var/lib/vz/dump offsite:playwolf-backup/vzdump/ --include 'vzdump-qemu-120-*' --max-age 8d --transfers 2 && curl -fsS -m 10 https://hc-ping.com/<uuid-vzdump> >/dev/null
```

These files are large. Retention of 3 weekly + 2 monthly is a compromise; adjust to the
offsite storage you are willing to pay for.

---

## 7. Monitoring and verification

**A backup job you are not monitoring is a backup job that stopped working three months ago.**
The failure mode is always the same: silent. No error reaches you because the thing that
would have sent the error is the thing that stopped.

### 7.1 Dead-man's switches

Use [healthchecks.io](https://healthchecks.io) (free tier is plenty) or any equivalent.
Create one check per job, each with a period slightly longer than the schedule:

| Check                    | Period  | Grace   | Pinged by                                                             |
| ------------------------ | ------- | ------- | --------------------------------------------------------------------- |
| `playwolf-media-copy`    | 1 day   | 3 hours | `playwolf-media-copy.sh`                                              |
| `playwolf-weekly-dump`   | 7 days  | 1 day   | `playwolf-weekly-dump.sh`                                             |
| `playwolf-media-reclaim` | 31 days | 3 days  | `playwolf-media-reclaim.sh` (option B only)                           |
| `playwolf-vzdump`        | 7 days  | 1 day   | the Proxmox host cron entry in [section 6](#6-tier-3--proxmox-vzdump) |

The ping lines are already in those scripts. The point is inversion: instead of the job
telling you when it fails, the monitor tells you when the job _stops telling you it
succeeded_. That catches what a failure alert structurally cannot — a deleted timer, a dead
VM, a full disk, a host that never came back from a reboot.

Coolify's daily Postgres backup is the one job with no script of its own to hang a ping on.
Cover it with Coolify's own alerting instead: `Settings → Notifications` → connect email or
Discord and enable backup failure notifications. That is a failure alert rather than a
dead-man's switch, so pair it with the weekly eyeball below, which is where you would notice
the dumps having silently stopped.

### 7.2 Weekly eyeball

Two minutes, once a week:

```bash
# Did each job run, and did it succeed?
systemctl list-timers 'playwolf-*'
journalctl -u playwolf-media-copy --since '7 days ago' | grep -iE 'error|failed' || echo "media copy clean"

# The offsite copy should be equal to or LARGER than the source — it retains
# objects deleted upstream. Smaller is the alarm.
rclone size garage:playwolf-media
rclone size offsite:playwolf-backup/media

# Is there a recent dump, and is it a plausible size?
rclone lsl offsite:playwolf-backup/postgres/ | tail -5

# Disk headroom on the VM
df -h /
```

The size comparison is the highest-value line, and the direction of the comparison is the
point. Because the copy job never deletes, the offsite side should always be a superset of
Garage: equal when nothing has been deleted upstream, larger once something has. **Offsite
being smaller than the source means something is deleting from the backup** — almost
certainly a `--delete` flag or an `rclone sync` that has crept into the daily job. Investigate
that immediately rather than at the next drill.

A copy that has not grown in weeks while you have been uploading is the other signal.

### 7.3 Monthly integrity check

Listing a file proves it exists. It does not prove it can be restored. Once a month, verify
that the newest dump actually parses:

```bash
LATEST=$(rclone lsf offsite:playwolf-backup/postgres/ | sort | tail -1)
rclone copy "offsite:playwolf-backup/postgres/${LATEST}" /tmp/verify/
pg_restore --list "/tmp/verify/${LATEST}" | head -40   # readable table of contents = valid
rm -rf /tmp/verify
```

And spot-check a random object round-trips:

```bash
KEY=$(rclone lsf offsite:playwolf-backup/media --files-only --recursive | shuf -n1)
rclone cat "offsite:playwolf-backup/media/${KEY}" | wc -c   # non-zero
```

### 7.4 Quarterly: rehearse a real restore

The monthly check proves the files are readable. It does not prove the _procedure_ works.
Once a quarter, run the full drill in [RESTORE.md §D](RESTORE.md#d-restore-rehearsal) —
restore into a throwaway VM and record how long it took.

**An untested backup is a hypothesis.** The drill is what turns it into a fact, and the
recorded elapsed time is what lets you answer "how long until we're back?" during an
outage instead of guessing.

---

## 8. Secrets that no backup contains

These are not in any dump, and several make the backups useless if lost:

| Secret                         | Consequence if lost                                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_SECRET`               | Every session invalidated; any encrypted field becomes unreadable. **A restored database is only partly usable without the original value.** |
| Garage access key + secret     | The app cannot reach its own objects. Recoverable — create a new key — but it is an outage while you do                                      |
| Postgres password              | Recoverable via `ALTER USER`, but only if you can get a shell                                                                                |
| Coolify admin login            | Recoverable via the Coolify CLI on the host                                                                                                  |
| Offsite S3 credentials         | You cannot reach the backups. Circular and fatal                                                                                             |
| `rclone crypt` password + salt | The offsite object backup is permanently unreadable                                                                                          |

Store all of them in a password manager with a vault entry named for this host. Verify the
entries exist as part of the quarterly drill — that is the moment you will otherwise find
out they do not.

---

## 9. What this protects against

| Failure                                    | Covered by                                                                                                   | Recovery point                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Deleted one artwork                        | The object is still in `media/` (the copy job never deletes) + daily dump                                    | ≤ 24 h, for up to 120 days after the deletion |
| Bad migration / corrupt database           | Local daily dump                                                                                             | ≤ 24 h                                        |
| Corruption noticed weeks later             | Weekly offsite dumps                                                                                         | ≤ 7 days, up to 8 weeks back                  |
| VM disk failure                            | `vzdump` + offsite dumps                                                                                     | ≤ 7 days for config, ≤ 24 h for data          |
| Proxmox host destroyed                     | Offsite S3 (all tiers)                                                                                       | ≤ 24 h                                        |
| Ransomware on the VM                       | Offsite with object lock/versioning                                                                          | ≤ 24 h                                        |
| Restore referencing a since-deleted object | Object retention (120 d) exceeding Postgres retention (≈56 d) — [5.4](#54-retention-and-pruning-for-objects) | Any restorable dump                           |
| Offsite provider disappears                | **Not covered** — single offsite target                                                                      |
| GitHub disappears                          | **Not covered** — add a mirror clone if this worries you                                                     |

The last two are accepted risk. Note them here rather than pretending otherwise, so the
decision is a decision and not an oversight.

Procedures for each of the covered rows: [RESTORE.md](RESTORE.md).
