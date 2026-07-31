# Deployment runbook — playwolf.net

End-to-end walkthrough for standing up production from nothing: a Proxmox VM, Docker,
Coolify, push-to-deploy from GitHub, and the existing Nginx Proxy Manager in front of it.

Follow it top to bottom the first time. Afterwards, [Day-2 operations](#12-day-2-operations)
is the part you come back to.

Related: [BACKUP.md](BACKUP.md) · [RESTORE.md](RESTORE.md)

---

## 0. Architecture and conventions

TLS terminates at **Nginx Proxy Manager (NPM)**, which already runs elsewhere on the LAN.
Coolify's bundled Traefik is **switched off** — two reverse proxies fighting over ports 80
and 443 ends badly. Coolify publishes each container on a **fixed** host port, and NPM
forwards plain HTTP to it.

```
Internet ──443──▶ Nginx Proxy Manager ──http──▶ Coolify VM
                  (TLS terminates here)         ├─ 3000  web (Next.js + Payload)
                                                ├─ 3900  Garage S3 API
                                                ├─ 8000  Coolify dashboard
                                                └─ 6001  Coolify realtime (websocket)

Inside the VM, on the Docker network (never published):
  web ──▶ postgres:5432
  web ──▶ garage:3900
```

Placeholders used throughout. Substitute your real values:

| Placeholder    | Meaning                        | Example         |
| -------------- | ------------------------------ | --------------- |
| `<VMID>`       | Proxmox VM ID                  | `120`           |
| `<VM_IP>`      | Static IP of the Coolify VM    | `10.10.10.20`   |
| `<NPM_IP>`     | IP of the Nginx Proxy Manager  | `10.10.10.10`   |
| `<GATEWAY>`    | LAN gateway                    | `10.10.10.1`    |
| `<ADMIN_CIDR>` | Where you SSH from             | `10.10.10.0/24` |
| `<NIC>`        | Guest NIC name (`ip -br link`) | `ens18`         |

---

## 1. Proxmox VM

### 1.1 Why a VM and not an LXC

Docker inside an **unprivileged LXC** hits overlayfs and cgroup permission quirks that cost
an afternoon to work around, and Coolify's installer assumes a standard Debian/Ubuntu host
with a real systemd and its own kernel-visible Docker. Use a full VM. This is not a
preference — treat it as a hard requirement.

### 1.2 Sizing

**2 vCPU / 4 GB RAM / 40 GB disk is the floor.** That comfortably covers Next.js + Payload,
Postgres, Garage, and Coolify itself. Give it 4 vCPU / 8 GB if the host has room —
`next build` inside the container is the memory spike, and sharp's image derivative
generation is the CPU spike.

Disk: 40 GB holds the OS, Docker images, Postgres, and a few thousand artwork originals.
Watch it; Garage objects are the part that grows. Growing the disk later is easy
(`qm resize <VMID> scsi0 +20G` then `growpart` + `resize2fs` in the guest), shrinking is not.

### 1.3 CPU type must be `host`

**Set the CPU type to `host`, not the `kvm64` default.** `kvm64` presents a deliberately
ancient feature set with no AVX2, SSE4.2, or FMA. sharp's bundled libvips dispatches on
those instruction sets at runtime, so on `kvm64` image processing silently falls back to
the slow path — and some prebuilt native binaries refuse to load at all. Every image upload
pays for this.

The trade-off: `host` pins the VM to CPUs of that model, so live-migrating to a host with a
different CPU will fail. If you migrate between mixed hosts, use the newest common named
model instead — `x86-64-v3` is the minimum that keeps AVX2.

### 1.4 Create the VM

Via the Proxmox UI, or from a shell on the Proxmox host:

```bash
# Adjust storage names (local-lvm, local) to match your host.
qm create 120 \
  --name coolify \
  --ostype l26 \
  --cpu host --cores 2 --sockets 1 \
  --memory 4096 --balloon 0 \
  --machine q35 \
  --scsihw virtio-scsi-single \
  --net0 virtio,bridge=vmbr0 \
  --agent enabled=1,fstrim_cloned_disks=1 \
  --onboot 1 \
  --startup order=2

qm set 120 --scsi0 local-lvm:40,discard=on,ssd=1,iothread=1
qm set 120 --ide2 local:iso/debian-12.11.0-amd64-netinst.iso,media=cdrom
qm set 120 --boot order='scsi0;ide2'

qm start 120
```

Flag-by-flag, for the ones that matter:

| Flag                   | Why                                                                                                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--cpu host`           | See [1.3](#13-cpu-type-must-be-host). Non-negotiable for sharp.                                                                                                                                |
| `--balloon 0`          | Disables memory ballooning. Postgres and the page cache behave badly when RAM is yanked out from under them. Fixed 4 GB.                                                                       |
| `--agent enabled=1`    | QEMU guest agent: lets Proxmox read the VM's IP, do filesystem-consistent `vzdump` snapshots, and shut down cleanly. The guest package still has to be installed — see [2.2](#22-guest-agent). |
| `--discard=on --ssd=1` | TRIM passthrough so deleted Docker layers actually return space to the underlying storage.                                                                                                     |
| `--iothread=1`         | Dedicated I/O thread with `virtio-scsi-single`; noticeably better disk latency under Postgres.                                                                                                 |
| `--onboot 1`           | Comes back automatically after a host reboot or power loss.                                                                                                                                    |

Install Debian 12 (Bookworm) or Ubuntu 24.04 LTS from the console. A minimal install —
**"SSH server" and "standard system utilities" only**, no desktop, no web server. Anything
listening on port 80 will collide later.

---

## 2. Base OS preparation

SSH in as root (or a sudo user; commands below assume root).

### 2.1 Update and basics

```bash
apt update && apt full-upgrade -y
apt install -y curl ca-certificates gnupg git ufw jq rclone unattended-upgrades
timedatectl set-timezone Europe/Berlin
hostnamectl set-hostname coolify
```

Enable automatic security updates:

```bash
dpkg-reconfigure -plow unattended-upgrades   # answer Yes
```

### 2.2 Guest agent

```bash
apt install -y qemu-guest-agent
systemctl enable --now qemu-guest-agent
```

Verify from the Proxmox host — this should print the VM's IP rather than an error:

```bash
qm agent 120 network-get-interfaces
```

If it errors, the `--agent enabled=1` flag or the in-guest package is missing. Fix it now;
`vzdump` snapshot consistency depends on it.

### 2.3 Static IP

The VM's address is baked into every NPM proxy host, so it must never change. Either
reserve it by MAC in your DHCP server, or configure it statically.

Debian (`/etc/network/interfaces`):

```
auto ens18
iface ens18 inet static
    address 10.10.10.20/24
    gateway 10.10.10.1
    dns-nameservers 10.10.10.1 1.1.1.1
```

Ubuntu (`/etc/netplan/01-static.yaml`, then `netplan apply`):

```yaml
network:
  version: 2
  ethernets:
    ens18:
      dhcp4: false
      addresses: [10.10.10.20/24]
      routes:
        - to: default
          via: 10.10.10.1
      nameservers:
        addresses: [10.10.10.1, 1.1.1.1]
```

### 2.4 Swap

Debian's guided install often creates none. Without it, a `next build` OOM-kills the
container instead of paging. 2 GB is enough:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl -w vm.swappiness=10
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
```

### 2.5 Docker

Coolify's installer will install Docker if it's absent, and that's fine. To do it yourself
first, use the official repository (not Debian's `docker.io` package, which lags):

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker version
```

Cap the log growth — container logs otherwise fill the disk over months.
Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

Then `systemctl restart docker`.

### 2.6 Firewall, and the Docker/UFW trap

**Read this before writing UFW rules.** Docker inserts its port-publishing rules into
iptables' `DOCKER` chain in the `nat` table, which is traversed _before_ UFW's `INPUT`
chain. A container published with `-p 3000:3000` is therefore reachable from anywhere on
the network **even if UFW says the port is denied**. UFW will happily report the port
blocked while it is wide open.

The fix used throughout this runbook: **publish every container port bound to the VM's LAN
IP**, never to `0.0.0.0`. In Coolify's port mapping fields that means writing
`10.10.10.20:3000:3000` rather than `3000:3000`. Combine that with UFW rules for the
services Docker isn't publishing (SSH, Coolify's own dashboard):

```bash
ufw default deny incoming
ufw default allow outgoing

ufw allow from 10.10.10.0/24 to any port 22 proto tcp comment 'SSH from admin LAN'
ufw allow from 10.10.10.10 to any port 8000 proto tcp comment 'Coolify UI from NPM'
ufw allow from 10.10.10.10 to any port 6001 proto tcp comment 'Coolify realtime from NPM'

ufw enable
ufw status verbose
```

If you would rather have UFW genuinely govern published container ports, install
[`ufw-docker`](https://github.com/chaifeng/ufw-docker) and use `ufw-docker allow <container> <port>`.
Either approach works; do not assume plain UFW alone is enough.

### 2.7 Which ports must be reachable from where

| Port   | Service                    | Reachable from       | Public? |
| ------ | -------------------------- | -------------------- | ------- |
| 22     | SSH                        | `<ADMIN_CIDR>`       | No      |
| 3000   | web — Next.js + Payload    | `<NPM_IP>`           | No      |
| 3900   | Garage S3 API              | `<NPM_IP>`           | No      |
| 3901   | Garage RPC                 | nothing (in-cluster) | No      |
| 3903   | Garage admin API           | localhost only       | No      |
| 3001   | Umami (optional)           | `<NPM_IP>`           | No      |
| 5432   | Postgres                   | **not published**    | No      |
| 8000   | Coolify dashboard          | `<NPM_IP>`           | No      |
| 6001   | Coolify realtime websocket | `<NPM_IP>`           | No      |
| 80/443 | on the **NPM** host only   | Internet             | Yes     |

**Nothing on this VM is exposed to the internet directly.** The only public listeners in
the whole system are NPM's 80 and 443. Port 5432 is never published to the host at all —
Postgres is reachable only over the Docker network by service name. If you need `psql`
access, go through `docker exec` or an SSH tunnel.

---

## 3. Install Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

The installer sets up Docker (if missing), pulls Coolify's own stack, and prints the
dashboard URL when it finishes. It takes a few minutes.

Open `http://<VM_IP>:8000` **immediately**.

> **The first account to register becomes the root administrator.** Until you register,
> that form is open to anyone who can reach port 8000. Register before you do anything
> else, and use a password manager. Then enable two-factor authentication under
> `Profile → Two-Factor Authentication`.

After registering:

1. `Settings → Instance Settings` — set the instance domain to `http://coolify.playwolf.net`
   (see [section 8](#8-optional-put-the-coolify-dashboard-behind-npm)). Leave it blank for
   now if you are not exposing the dashboard yet.
2. Confirm `localhost` appears as a connected server with a green status.

---

## 4. Disable Coolify's proxy (critical)

Do this **before** deploying anything, so no Traefik container ever starts and grabs port 80.

1. `Servers → localhost → Proxy`
2. Change the proxy from **Traefik** to **None / Custom**
3. Save, and if a Traefik container is already running, stop it from the same screen

Verify from the VM shell that nothing holds 80 or 443:

```bash
ss -tlnp | grep -E ':(80|443)\s'    # expect no output
docker ps --format '{{.Names}}\t{{.Ports}}'
```

With the proxy set to None, Coolify stops generating Traefik labels and stops managing
certificates. Two consequences follow, and both are intentional:

- **Port publishing is now your job.** Each application's `Ports Mappings` field is the
  only thing that makes it reachable. Nothing is auto-exposed.
- **Service URLs are declared with `http://`, not `https://`.** NPM holds the certificate
  and speaks plain HTTP to the container. Writing `https://` in Coolify makes it advertise
  a scheme it cannot serve, and Payload will generate broken absolute URLs. The public site
  is still HTTPS-only — that is enforced at NPM.

---

## 5. Wire up the GitHub repository

Repository: `github.com/PlayWolfYT/playwolf.net`.

### 5.1 Choose a source connection

**GitHub App (recommended).** `Sources → + Add → GitHub App`, then follow the flow to
create and install an app on the `PlayWolfYT` account, granting access to this repository
only. The app gives Coolify webhook delivery, commit statuses, and PR-preview deployments
without you managing keys.

**Deploy key (fallback).** If you would rather not install an app: `Keys & Tokens → Private
Keys → Generate`, copy the public half into the repository's
`Settings → Deploy keys` (read-only is enough), and add the repo in Coolify as
_Private Repository (with deploy key)_. You then have to add the webhook by hand — Coolify
shows the URL and secret under the application's `Webhooks` tab; paste both into
`Settings → Webhooks → Add webhook`, content type `application/json`, event: _Just the push event_.

> **Webhooks require GitHub to reach Coolify.** If the dashboard is not published through
> NPM, GitHub's delivery attempts fail and nothing auto-deploys. Either complete
> [section 8](#8-optional-put-the-coolify-dashboard-behind-npm) or accept manual "Deploy"
> clicks. Check `Settings → Webhooks → Recent Deliveries` on GitHub when a push does not
> trigger a build.

### 5.2 Project and environments

Create one project, `playwolf`, with two environments mapped to long-lived branches:

| Environment  | Branch        | Domain                 | Notes                                       |
| ------------ | ------------- | ---------------------- | ------------------------------------------- |
| `production` | `production`  | `playwolf.net`         | Auto-deploy on push                         |
| `staging`    | `development` | `staging.playwolf.net` | Auto-deploy on push; separate DB and bucket |

`main` is not deployed. Work merges into `development`, gets verified on staging, then
merges into `production`.

**Staging must not share production's database or Garage bucket.** Give it its own Postgres
resource and its own bucket (`playwolf-media-staging`). A staging deploy running Payload
migrations against production is the accident this prevents.

### 5.3 Application build settings

`+ New → Application → <your source> → PlayWolfYT/playwolf.net`, then:

| Setting             | Value                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| Build Pack          | **Dockerfile**                                                                        |
| Base Directory      | `/`                                                                                   |
| Dockerfile Location | `/Dockerfile`                                                                         |
| Branch              | `production` (or `development` for staging)                                           |
| Ports Exposes       | `3000`                                                                                |
| Ports Mappings      | `10.10.10.20:3000:3000` ← the VM's LAN IP, not `0.0.0.0`                              |
| Domains             | `http://playwolf.net` ← **http**, per [section 4](#4-disable-coolifys-proxy-critical) |
| Health Check Path   | `/`                                                                                   |
| Auto Deploy         | On                                                                                    |

The repository's [`Dockerfile`](../Dockerfile) is a two-stage build: `oven/bun:1.3-alpine`
installs dependencies and runs `next build`, then `node:22-alpine` runs the standalone
output as `node server.js` on port 3000 as a non-root user. Bun is the package manager and
build toolchain; Node is the runtime, which is what Payload officially supports. Do not
switch the build pack to Nixpacks — it will not reproduce this split.

**Build resources.** `next build` with sharp is the heaviest thing this VM does. If builds
get OOM-killed on a 4 GB VM, either raise the VM to 8 GB or switch to the prebuilt-image
strategy in [5.5](#55-alternative-deploy-the-prebuilt-ghcr-image).

### 5.4 Persistent storage

Add these under the application's `Storages` tab:

| Mount path         | Purpose                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/app/.next/cache` | Next.js image-optimizer cache. Without it every deploy re-encodes every image on first request, which on a 2 vCPU VM is minutes of pegged CPU and visibly slow pages. |

Media does **not** get a volume — it lives in Garage.

### 5.5 Alternative: deploy the prebuilt GHCR image

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) already builds and pushes images
to `ghcr.io/playwolfyt/playwolf.net` on published releases, tagged `:latest` for releases
targeting `production` and `:latest-dev` for `development`. If you want the VM to stop
building altogether, create the application as _Docker Image_ instead of _Dockerfile_,
point it at `ghcr.io/playwolfyt/playwolf.net:latest`, and add a GHCR registry credential
under `Keys & Tokens` (a GitHub PAT with `read:packages`).

Trade-off: builds move off the VM and deploys become seconds instead of minutes, but you
deploy on _release publication_ rather than on push, and you lose Coolify's build logs.
Start with the Dockerfile build; switch if build time or memory becomes annoying.

### 5.6 Supporting resources

Add to the same project, in the same environment:

- **Postgres 16** — `+ New → Database → PostgreSQL`. Do **not** enable "Make it publicly
  available". Note the generated internal hostname; Coolify names it something like
  `postgresql-<id>`, and that hostname goes into `DATABASE_URL`.
- **Garage** — as a Docker Compose resource (see [section 7](#7-garage-object-storage)).
- **Redis is not needed.** The Payload stack does not use it, and the roadmap replaces the
  Redis service in `docker-compose.yml` with Garage. If a Redis container exists from the
  old Portainer setup, remove it rather than carry it forward.

---

## 6. Fixed host ports and Nginx Proxy Manager

### 6.1 The port allocation

Because Coolify's proxy is off, Docker would otherwise assign random high ports on every
recreate, and NPM's upstreams would break on each deploy. Every service therefore gets a
**fixed, documented** host port. Keep this table current — it is the contract between
Coolify and NPM.

| Host binding   | Container        | Container port | Fronted by NPM as          |
| -------------- | ---------------- | -------------- | -------------------------- |
| `<VM_IP>:3000` | web (prod)       | 3000           | `playwolf.net`             |
| `<VM_IP>:3010` | web (staging)    | 3000           | `staging.playwolf.net`     |
| `<VM_IP>:3900` | garage           | 3900           | `media.playwolf.net`       |
| `<VM_IP>:3001` | umami            | 3000           | `stats.playwolf.net`       |
| `<VM_IP>:8000` | coolify          | 8000           | `coolify.playwolf.net`     |
| `<VM_IP>:6001` | coolify-realtime | 6001           | `coolify.playwolf.net/app` |

### 6.2 NPM proxy host — `playwolf.net`

`Hosts → Proxy Hosts → Add Proxy Host`:

**Details tab**

- Domain Names: `playwolf.net`, `www.playwolf.net`
- Scheme: **http**
- Forward Hostname / IP: `<VM_IP>`
- Forward Port: `3000`
- Cache Assets: **off** — Next.js sets its own `Cache-Control` headers and NPM caching in
  front of them causes stale HTML after a deploy
- Block Common Exploits: on
- **Websockets Support: ON** — required. Payload's admin panel uses a websocket connection
  for live preview and hot updates; without it the admin UI loads but parts of it hang or
  reconnect in a loop.

**SSL tab**

- Request a new Let's Encrypt certificate, Force SSL on, HTTP/2 on, HSTS on

**Advanced tab**

```nginx
# Artwork originals are large. Nginx's 1 MB default rejects them with a 413
# long before Payload sees the request.
client_max_body_size 64m;

# Big uploads and sharp derivative generation both take longer than the 60s default.
proxy_read_timeout    300s;
proxy_send_timeout    300s;
proxy_request_buffering off;
```

`client_max_body_size` is the single most common first-day failure. Set it before you try
your first upload, not after.

NPM's generated config already sets `Host`, `X-Forwarded-Proto`, `X-Forwarded-Scheme`,
`X-Forwarded-For` and `X-Real-IP` on every proxied location, so do not re-declare them here —
location-level directives win over anything you put in this server-level block, and adding
them only creates the illusion of control. What matters is that the app _trusts_ them:
Next.js and Payload derive absolute URLs from the forwarded scheme, and if they come out as
`http://` behind an `https://` site, the problem is `NEXT_PUBLIC_SITE_URL` (section 9), not
this block.

### 6.3 NPM proxy host — `media.playwolf.net` (Garage)

Only needed if the browser fetches originals straight from Garage. If every image is served
through Next.js's optimizer or a Payload route, skip this and keep Garage entirely internal.

- Domain Names: `media.playwolf.net`
- Scheme: **http**, Forward: `<VM_IP>:3900`
- Websockets: off (S3 does not need them)
- Advanced:

```nginx
client_max_body_size 512m;
proxy_read_timeout   300s;
proxy_request_buffering off;
```

Garage is addressed path-style (`forcePathStyle: true`), so the bucket travels in the URI
and NPM's default `Host $host` is exactly right — leave it alone. Do not enable NPM's
"Cache Assets" here either; S3 responses carry their own validators and an extra cache layer
in front of immutable object keys buys nothing while making stale content possible.

If you expose this, the bucket needs Garage's website/anonymous-read permission for the
media prefix, or every request returns 403. Grant read to anonymous only for the bucket you
intend to be public.

### 6.4 Staging

Same as [6.2](#62-npm-proxy-host--playwolfnet) with `staging.playwolf.net` → `<VM_IP>:3010`.
Add HTTP Basic Auth via NPM's Access Lists so staging is not indexed or wandered into.

### 6.5 Verify the chain

```bash
# From the NPM host — plain HTTP to the container must work:
curl -sI http://<VM_IP>:3000/ | head -n1        # HTTP/1.1 200 OK

# From anywhere — TLS terminating at NPM:
curl -sI https://playwolf.net/ | head -n1       # HTTP/2 200

# Websocket upgrade must be accepted, not 400/426:
curl -sI -o /dev/null -w '%{http_code}\n' \
  -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  https://playwolf.net/admin
```

---

## 7. Garage object storage

Garage runs as a Docker Compose resource in the same Coolify project. It replaces MinIO,
whose community edition was archived read-only in April 2026.

After the container is up, initialize the single-node cluster from the VM shell. **A fresh
Garage node serves nothing until a layout is assigned** — this step is easy to skip and
produces confusing "no partitions available" errors.

```bash
GARAGE="docker exec -it <garage-container> /garage"

# 1. Read the node ID
$GARAGE status

# 2. Assign the node to a zone with a capacity, then apply the layout
$GARAGE layout assign -z dc1 -c 30G <node-id-from-status>
$GARAGE layout apply --version 1

# 3. Create the bucket
$GARAGE bucket create playwolf-media

# 4. Create an access key for the app and grant it the bucket
$GARAGE key create playwolf-app
#    → prints Key ID and Secret key. Copy both now; the secret is not shown again.
$GARAGE bucket allow --read --write --owner playwolf-media --key playwolf-app

# 5. Confirm
$GARAGE bucket info playwolf-media
```

Repeat with `playwolf-media-staging` and a separate key for the staging environment.

Garage speaks S3 but **requires path-style addressing** — Payload's S3 storage adapter needs
`forcePathStyle: true`, and any `rclone` remote pointing at it needs
`force_path_style = true`. Virtual-host-style requests (`bucket.host/key`) will fail.

---

## 8. Optional: put the Coolify dashboard behind NPM

Needed for GitHub webhooks to reach Coolify, and pleasant to have. Coolify serves the UI on
8000 and a **separate realtime websocket service on 6001** which the dashboard needs for
live build logs and status.

1. In Coolify: `Settings → Instance Settings → Instance Domain` = `http://coolify.playwolf.net`
2. In NPM, add a proxy host:
   - Domain: `coolify.playwolf.net`, scheme `http`, forward `<VM_IP>:8000`
   - **Websockets Support: ON**
   - SSL: Let's Encrypt, Force SSL
   - Advanced:

```nginx
client_max_body_size 64m;
proxy_read_timeout 3600s;   # long build-log streams

# Coolify's realtime service is a second upstream on 6001.
location /app {
    proxy_pass http://<VM_IP>:6001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host       $host;
}
```

3. Restrict it with an NPM Access List (Basic Auth or IP allowlist) — but **exclude the
   webhook path**, or GitHub's deliveries get a 401. Coolify's webhook endpoints live under
   `/webhooks/`; they authenticate with their own secret.

If you skip this section, deploy by clicking **Deploy** in the Coolify UI after each push.

---

## 9. Environment variables

Two homes for configuration, and the split is deliberate.

**Coolify-managed** — infrastructure: secrets, connection strings, anything needed _before_
the app can talk to its database. Set under the application's `Environment Variables` tab.
Changing one requires a redeploy.

**Payload `siteSettings` global** — editorial: anything you might reasonably want to change
at 2 a.m. without a deploy. Edited at `/admin` and takes effect immediately.

### 9.1 Coolify-managed variables

Names below are the ones [`src/payload.config.ts`](../src/payload.config.ts) actually reads.

| Variable               | Example                                                    | Secret | Notes                                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------- | :----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | `production`                                               |        | Already set by the Dockerfile                                                                                                                                                                                              |
| `DATABASE_URL`         | `postgres://playwolf:<pw>@postgresql-abc123:5432/playwolf` |   ✓    | **`_URL`, not `_URI`** — Payload's docs use `DATABASE_URI`, this config does not. Internal Docker hostname; never `localhost`. URL-encode `@ : / ? #` in the password                                                      |
| `PAYLOAD_SECRET`       | 64 random hex chars                                        |   ✓    | Signs auth tokens. **Changing it invalidates every session and breaks existing encrypted fields.** Generate once: `openssl rand -hex 32`. Store it in your password manager — it is not recoverable from a database backup |
| `NEXT_PUBLIC_SITE_URL` | `https://playwolf.net`                                     |        | Public origin for OG/Twitter image URLs. **`https://` here** — this is what browsers see, unlike the Coolify service URL. No trailing slash. Build-time; see below                                                         |
| `S3_ENDPOINT`          | `http://garage:3900`                                       |        | Internal Docker hostname, plain HTTP inside the network. Defaults to exactly this if unset                                                                                                                                 |
| `S3_REGION`            | `garage`                                                   |        | Garage ignores it, the AWS SDK insists on it                                                                                                                                                                               |
| `S3_BUCKET`            | `playwolf-media`                                           |        | `playwolf-media-staging` on staging                                                                                                                                                                                        |
| `S3_ACCESS_KEY_ID`     | from `garage key create`                                   |   ✓    |                                                                                                                                                                                                                            |
| `S3_SECRET_ACCESS_KEY` | from `garage key create`                                   |   ✓    | Shown once at creation                                                                                                                                                                                                     |
| `UMAMI_SCRIPT_URL`     | `https://stats.playwolf.net/script.js`                     |        | Optional. Empty means no tracker is rendered ([section 14](#14-optional-analytics-umami))                                                                                                                                  |
| `UMAMI_WEBSITE_ID`     | UUID from the Umami dashboard                              |        | Optional. Both this and the URL must be set before anything is loaded                                                                                                                                                      |

There is **no `S3_FORCE_PATH_STYLE` variable** — `forcePathStyle: true` is hardcoded in the
config, because it is not optional for Garage and nothing is gained by letting it be turned
off. Likewise there is no `NEXT_PUBLIC_SERVER_URL`; `NEXT_PUBLIC_SITE_URL` is the only public
origin the app reads.

Every `S3_*` value has a default in the config, so a missing one fails at upload time rather
than at boot. Set all of them explicitly.

Mark every row with a ✓ as **Secret** in Coolify so its value is masked in logs and the UI.

**`NEXT_PUBLIC_SITE_URL` must be marked as a build-time variable.** Next.js inlines
`NEXT_PUBLIC_*` values into the client bundle during `next build`; they are not read at
runtime. Set as a runtime-only variable, the build bakes in the `https://playwolf.net`
fallback and your change silently does nothing — the classic symptom is OG images still
pointing at the old origin after you "fixed" it. In Coolify, tick **Build Variable** on that
row, and remember that changing it requires a full rebuild, not a restart.

The corollary: never put a secret in a `NEXT_PUBLIC_*` variable. It ends up in JavaScript
that every visitor downloads.

**Internal hostnames require a shared Docker network.** `DATABASE_URL` and `S3_ENDPOINT`
above address other containers by service name. That only resolves if the application and
those resources are attached to the same network — in Coolify, put them in the same project
and environment, or connect them explicitly under the application's `Network` settings. A
`getaddrinfo ENOTFOUND garage` on boot is this and nothing else.

`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` belong to the Postgres _resource_, not
the application; Coolify manages them there and composes the connection string for you.

### 9.2 Payload `siteSettings` global

Moved out of environment variables on purpose:

| Field             | Replaces                           |
| ----------------- | ---------------------------------- |
| Maintenance mode  | the old `MAINTENANCE_MODE` env var |
| Landing page copy | hardcoded hero/about strings       |
| Social links      | hardcoded link lists               |

If `MAINTENANCE_MODE` is still set in Coolify, **delete it** — nothing reads it any more, and
leaving it there implies a second source of truth that does not exist. Maintenance mode is a
checkbox under `Site settings → Status`, and flipping it takes effect on the next request.

### 9.3 `.env.example`

[`.env.example`](../.env.example) is the local-development set and tracks the same variables
as the table above, minus the Coolify-specific plumbing. Where the two disagree, the table in
[9.1](#91-coolify-managed-variables) is authoritative for production.

---

## 10. First deploy

1. Push to `production` (or click **Deploy** in Coolify).
2. Watch the build log. The Bun install and `next build` stage is the slow part — several
   minutes on first run with a cold Docker layer cache.
3. When it reports healthy:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -sI http://<VM_IP>:3000/ | head -n1
```

4. If the container starts and immediately restarts, read the _container_ logs rather than
   the build logs — it is almost always `DATABASE_URL` pointing at the wrong hostname, or a
   missing `PAYLOAD_SECRET`.

**Database migrations run themselves.** `src/payload.config.ts` passes the contents of
`src/migrations/` to the Postgres adapter as `prodMigrations`, which the adapter applies on
connect whenever `NODE_ENV` is `production`. A deploy therefore migrates its own schema on
boot, and there is no pre-deployment command to configure.

This is deliberate rather than merely convenient: the runtime image is Next's standalone
output, which contains neither the repository source nor the Payload CLI, so there is no
`payload migrate` to run inside it.

What this means in practice:

- **Deploy order matters.** A migration ships in the same image as the code that needs it,
  so a rollback to an older image will not roll the schema back. See section 12 for what to
  do when a deploy has to be reverted after migrating.
- **Watch the first boot after a schema change.** A failed migration fails the connect, so
  the container will restart-loop rather than serve a half-migrated database. The container
  logs name the migration that failed.
- **Migrations are authored locally**, against a throwaway database, and committed:

```bash
# with DATABASE_URL pointing at a scratch Postgres, not production
bun run migrate:create
```

Development is unaffected — the adapter pushes schema changes directly there, so a
migration only needs generating once a change has settled.

---

## 11. First-boot checklist

Work through this in order on a brand-new instance. Each step depends on the one before it.

- [ ] **1. Site responds.** `https://playwolf.net` returns 200 over HTTPS with a valid
      certificate, and `http://` redirects to `https://`.
- [ ] **2. Create the admin user.** Visit `https://playwolf.net/admin`. On an empty database
      Payload shows its first-user form automatically — no CLI command, no seed script. Fill
      it in immediately. > This form is open to whoever reaches it first. Do this the moment the app is > publicly resolvable, not tomorrow.
- [ ] **3. Admin panel is fully functional.** Navigate between collections; the left nav and
      live updates work. If it loads but hangs or spins, websocket support is off on the NPM
      proxy host — go back to [6.2](#62-npm-proxy-host--playwolfnet).
- [ ] **4. Garage bucket exists and is writable.** `garage bucket info playwolf-media` lists
      the `playwolf-app` key with read/write/owner.
- [ ] **5. Upload a small image** (< 1 MB) in the Media collection. It should save, show
      dimensions and a thumbnail.
- [ ] **6. Confirm the object actually landed in Garage**, not on the container's disk:

```bash
docker exec -it <garage-container> /garage bucket info playwolf-media   # object count > 0
```

- [ ] **7. Upload a large original** (10–20 MB PNG, i.e. a real artwork). This is the step
      that catches `client_max_body_size`. A 413 here means [6.2](#62-npm-proxy-host--playwolfnet)
      was not applied; a timeout means the `proxy_read_timeout` bump was not.
- [ ] **8. Derivatives were generated.** The media document lists the configured `imageSizes`
      (thumbnail plus the ~2560px display master) alongside the untouched original. Empty
      derivatives mean sharp failed — check the container logs for a libvips error, which
      usually traces back to the CPU type not being `host` ([1.3](#13-cpu-type-must-be-host)).
- [ ] **9. Image optimization works end to end.** Load a page rendering that artwork and
      confirm in DevTools that the `<img>` requests `/_next/image?url=...` and returns
      `content-type: image/avif` or `image/webp`, not the original PNG.
- [ ] **10. Originals are reachable but not shipped.** The "Open full image" link resolves to
      the untouched original; no page embeds the original directly.
- [ ] **11. Revalidation works.** Edit a published document in the admin, reload the public
      page, confirm the change appears without a redeploy.
- [ ] **12. Push-to-deploy works.** Make a trivial commit on `production`; a build starts
      unprompted. If not, check GitHub's webhook delivery log ([5.1](#51-choose-a-source-connection)).
- [ ] **13. Backups are configured and have run once.** Follow [BACKUP.md](BACKUP.md); do not
      consider the deployment finished until a backup exists and has been listed at the
      offsite target.
- [ ] **14. Record the secrets** — `PAYLOAD_SECRET`, Postgres password, Garage key pair,
      Coolify admin login, offsite S3 credentials — in your password manager. Several of
      these cannot be recovered from any backup.

---

## 12. Day-2 operations

**Deploy.** Push to `production`. Or Coolify UI → application → **Deploy**.

**Roll back.** Coolify's `Deployments` tab lists previous builds; each has a **Rollback**
action that redeploys that image. Note that a rollback does _not_ revert database
migrations — if the bad deploy migrated the schema, restore the database too
([RESTORE.md](RESTORE.md), scenario B).

**Logs.** Coolify UI → application → `Logs`, or:

```bash
docker logs -f --tail 200 <web-container>
```

**Shell into the app.**

```bash
docker exec -it <web-container> sh
```

**Restart just the app.** Coolify UI → `Restart`. Avoid `docker restart` directly; Coolify
tracks state.

**Disk pressure.** Docker image layers are the usual culprit:

```bash
df -h /
docker system df
docker system prune -af --filter 'until=168h'   # images unused for a week
```

**Upgrade Coolify.** `Settings → Upgrade` in the UI. Take a Proxmox snapshot first
(`qm snapshot <VMID> pre-coolify-upgrade`) — it is a two-minute insurance policy.

**Upgrade the OS.** `apt update && apt full-upgrade` monthly; reboot during a quiet window.
`--onboot 1` brings the VM back and Docker's `restart: unless-stopped` brings the containers back.

---

## 13. Troubleshooting

| Symptom                                                   | Likely cause                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 502 Bad Gateway from NPM                                  | Container down, or the port mapping changed. `curl http://<VM_IP>:3000/` from the NPM host                                      |
| Admin panel loads but hangs / reconnect loop              | Websocket support off on the NPM proxy host ([6.2](#62-npm-proxy-host--playwolfnet))                                            |
| 413 on upload                                             | `client_max_body_size` not set in NPM's Advanced tab                                                                            |
| Upload times out on large files                           | `proxy_read_timeout` / `proxy_send_timeout` still at 60s                                                                        |
| Uploads succeed, images never appear                      | The Garage key lacks read/write/owner on the bucket, or `S3_BUCKET` names a bucket that does not exist                          |
| Garage returns "no partitions available"                  | Layout never assigned/applied ([section 7](#7-garage-object-storage))                                                           |
| sharp errors, no derivatives generated                    | VM CPU type is not `host` ([1.3](#13-cpu-type-must-be-host))                                                                    |
| Mixed-content warnings, `http://` links in HTML           | `NEXT_PUBLIC_SITE_URL` set to `http://`                                                                                         |
| Changed `NEXT_PUBLIC_*` and nothing happened              | Not marked as a build variable, or only restarted instead of rebuilt ([9.1](#91-coolify-managed-variables))                     |
| `getaddrinfo ENOTFOUND garage` / `ENOTFOUND postgresql-…` | App and resource are not on the same Docker network ([9.1](#91-coolify-managed-variables))                                      |
| Redirect loop                                             | Both NPM _and_ Coolify forcing HTTPS. Coolify's service URL must be `http://` ([section 4](#4-disable-coolifys-proxy-critical)) |
| Push does not trigger a deploy                            | Webhook cannot reach Coolify ([section 8](#8-optional-put-the-coolify-dashboard-behind-npm))                                    |
| Port reachable that UFW says is blocked                   | The Docker/UFW trap ([2.6](#26-firewall-and-the-dockerufw-trap))                                                                |
| Every image slow for minutes after a deploy               | `/app/.next/cache` volume missing ([5.4](#54-persistent-storage))                                                               |
| Build OOM-killed                                          | Raise VM RAM to 8 GB, or deploy the prebuilt GHCR image ([5.5](#55-alternative-deploy-the-prebuilt-ghcr-image))                 |

---

## 14. Optional: analytics (Umami)

Self-hosted, cookie-free page analytics. Entirely optional — the site renders no tracker at
all until both `UMAMI_SCRIPT_URL` and `UMAMI_WEBSITE_ID` are set, and nothing else in the
stack depends on the service.

Umami is behind a Compose profile so it never starts by accident:

```bash
docker compose --profile analytics up -d umami
```

### 14.1 Its database

Umami keeps its own schema and gets its own database inside the existing Postgres instance —
one instance is plenty for both at this scale. [`docker/postgres-init/01-analytics-db.sh`](../docker/postgres-init/01-analytics-db.sh)
creates it, but Postgres only runs init scripts against a **fresh data directory**. On an
existing volume, create it once by hand:

```bash
docker compose exec db createdb -U playwolf umami
```

Set `UMAMI_APP_SECRET` (`openssl rand -hex 32`) before the first start; it signs Umami's own
sessions, and changing it later logs you out of the dashboard.

### 14.2 Behind NPM

Port `3001` is already reserved for it in [the port table](#61-the-port-allocation). Add a
proxy host for `stats.playwolf.net` → `<VM_IP>:3001`, scheme `http`, Let's Encrypt, Force
SSL. No websocket support or body-size tuning is needed.

### 14.3 Pointing the site at it

In the Umami dashboard, add a website and copy its **Website ID**. Then set on the app:

```
UMAMI_SCRIPT_URL=https://stats.playwolf.net/script.js
UMAMI_WEBSITE_ID=<the UUID from the dashboard>
```

These are read **per request**, not at build time — deliberately, because the image is built
in CI, which does not know your analytics URL. A restart is enough; no rebuild. That is also
why they are not named `NEXT_PUBLIC_*`.

Verify by loading the site and checking that `script.js` is requested, then that the visit
appears under Realtime. If the script 404s, the proxy host is wrong; if it loads but nothing
records, the website ID does not match the one in the dashboard.

### 14.4 Backups

The `umami` database is included in the Postgres dump — see
[BACKUP.md](BACKUP.md). Losing it loses history and nothing else, so it does not warrant its
own restore drill.

---

## 15. Assumptions

This runbook was written against the roadmap's intended architecture while the Payload and
Garage work was still in progress on another branch. The following are **assumptions to
reconcile** once that work lands. None of them change the shape of the deployment, but the
exact strings may differ.

1. **Compose service names.** `web`, `db`/`postgresql-*`, `garage` and `umami` are used
   throughout, matching [`docker-compose.yml`](../docker-compose.yml). Coolify generates its
   own container names for managed resources, so **verify actual names with `docker ps` and
   substitute.**
2. ~~**Environment variable names.**~~ **Resolved.** [`src/payload.config.ts`](../src/payload.config.ts)
   now exists and [9.1](#91-coolify-managed-variables) has been reconciled against it:
   `DATABASE_URL` (not `DATABASE_URI`), no `NEXT_PUBLIC_SERVER_URL`, and `forcePathStyle`
   hardcoded rather than driven by `S3_FORCE_PATH_STYLE`. Re-check if that file changes.
3. **Garage** is pinned to `dxflrs/garage:v2.3.0` in `docker-compose.yml`, configured by
   `docker/garage.toml`. The image ships only the static binary, so `/garage` is the
   in-container path and there is no shell to fall back on.
4. **`imageSizes`.** The media collection generates `thumbnail` (480px), `card` (1024px) and
   `display` (2560px) WebP derivatives; the original upload is kept untouched alongside them.
5. **Migrations** are applied by the app itself on boot via the adapter's `prodMigrations`,
   so no CLI runs in production. Verified: Payload's CLI does work under Bun for authoring
   them locally (`bun run migrate:create`), without needing `--disable-transpile`.
6. **Coolify's realtime port (6001)** and dashboard port (8000) are current defaults. Check
   `docker ps` on the Coolify stack if the dashboard's live updates do not work.
7. **`MAINTENANCE_MODE`** is documented as moving into `siteSettings`. Until that todo
   lands, it is still an env var read from the environment — keep it set in Coolify in the
   meantime.
8. **NPM runs on a separate host** from this VM. If it turns out to run on the same host,
   bind the published ports to `127.0.0.1` instead of `<VM_IP>` and drop the corresponding
   UFW rules.
