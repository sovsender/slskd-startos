<p align="center">
  <img src="icon.svg" alt="slskd Logo" width="21%">
</p>

# slskd on StartOS

> Everything not listed in this document should behave the same as upstream
> slskd. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section
> of `instructions.md` for links.

[slskd](https://github.com/slskd/slskd) is a Soulseek client with a web interface and an API. This package runs it with package-owned credentials, saves downloads into FileBrowser Quantum or NextExplorer, and can run [Soularr](https://github.com/mrusse/soularr) beside it to fetch the albums Lidarr is missing and hand them to Lidarr for import.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Two images: the upstream slskd image, run unmodified, and a Soularr image built by this package.

| Image     | Source                                                                                                                                    | Architectures   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `slskd`   | `slskd/slskd`, unmodified                                                                                                                 | x86_64, aarch64 |
| `soularr` | `soularr.Dockerfile`: a digest-pinned slim Python base plus Soularr's source at a pinned commit, without its web UI or that UI's packages | x86_64, aarch64 |

| Subcontainer  | Runs                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slskd-sub`   | The `primary` daemon: the image's own entrypoint (`tini` → `entrypoint.sh` → `slskd`) as PID 1, with `PUID`/`PGID` 1000, so slskd runs as uid 1000                     |
| `soularr-sub` | The `soularr` daemon, only while Lidarr Automation is on: a shell loop that runs one Soularr pass, waits the check interval, and repeats, as user `soularr` (uid 1000) |

When a shared folder is set, each start also creates a short-lived `share-check` subcontainer to find out whether that folder exists.

Two oneshots run as root before the daemons: `prepare-downloads` gives uid 1000 ownership of the download folder itself (not its contents), and `prepare-soularr` does the same for Soularr's data directory.

## Volume and Data Layout

The package has two volumes of its own and mounts one folder or two from the selected file manager, plus Lidarr's shared key directory while Lidarr Automation is on.

| Volume / source                      | Mounted in    | Mount point                                                             | Contents                                                                               |
| ------------------------------------ | ------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `startos`                            | —             | —                                                                       | `store.json`: credentials, generated keys, and the choices made in actions             |
| `main`, subpath `slskd`              | `slskd-sub`   | `/app`                                                                  | `slskd.yml`, slskd's SQLite databases in `data/`, `logs/`, and `incomplete/` downloads |
| `main`, subpath `soularr`            | `soularr-sub` | `/data`                                                                 | Soularr's `config.ini` and its state files (search attempts, failed imports)           |
| File manager `data`, download folder | both          | `/mnt/filebrowser/<folder>` or `/mnt/nextexplorer/<folder>`, read-write | Finished downloads                                                                     |
| File manager `data`, shared folder   | `slskd-sub`   | `/mnt/filebrowser/<folder>` or `/mnt/nextexplorer/<folder>`, read-only  | Files shared with other Soulseek users                                                 |
| Lidarr `startos`, subpath `share`    | `soularr-sub` | `/mnt/lidarr`, read-only                                                | Lidarr's API key                                                                       |

The download folder is mounted at the same path Lidarr uses for that file manager (`/mnt/filebrowser`, `/mnt/nextexplorer`), so the path Soularr hands to Lidarr is valid inside Lidarr. Only the download folder and the shared folder are mounted, not the rest of the file manager's storage. Incomplete downloads stay on `main` and move to the download folder when they finish.

## File Models

The package owns three files. The two configuration files are rewritten whole on every start, so hand edits do not survive.

| File         | Format | Location                   | Written                                                     |
| ------------ | ------ | -------------------------- | ----------------------------------------------------------- |
| `store.json` | JSON   | `startos:/store.json`      | By init (generated keys) and by every action                |
| `slskd.yml`  | YAML   | `main:/slskd/slskd.yml`    | Whole, before slskd starts                                  |
| `config.ini` | INI    | `main:/soularr/config.ini` | Whole, before Soularr starts, while Lidarr Automation is on |

`slskd.yml` sets remote configuration and remote file management off, the startup version check off, the downloads and incomplete directories, the shared directory (or none), the web listener (port 5030 on `0.0.0.0`, HTTPS off), authentication (user `admin`, the stored password, the stored JWT key, and the API keys), the Soulseek username, password, and listen port 50300, and the upload and download slot and speed limits from Transfer Limits (a limit left empty is omitted, which slskd treats as unlimited). Because remote configuration is off, slskd's web UI cannot edit the file, and every other slskd option keeps its upstream default.

The API keys in `slskd.yml` are limited to `127.0.0.1/32,::1/128`: `startos` (read-only), used by the Soulseek health check, and `soularr` (read-write), present only while Lidarr Automation is on.

`config.ini` sets Lidarr's API key, bridge address, and download path; slskd's API key, address (`http://127.0.0.1:5030`), and download path; `search_type = incrementing_page`; `log_to_file = False`, so Soularr logs only to the service log; and the values from Lidarr Automation: `allowed_filetypes`, `download_filtering`, `album_prepend_artist`, `minimum_filename_match_ratio`, `search_source`, and `number_of_albums_to_grab`. Every other Soularr option uses Soularr's built-in fallback.

Environment variables set by the package: `PUID`, `PGID`, and `TZ` for slskd, read on every launch; `SOULARR_INTERVAL` (seconds) for the Soularr loop.

## Dependencies

All three dependencies are optional, and each is declared only while the package uses it.

| Dependency          | Declared while              | Kind                              | Mounted                                                             | Why                                                   |
| ------------------- | --------------------------- | --------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| FileBrowser Quantum | It is the download location | `exists`                          | `data`: the download folder read-write, the shared folder read-only | Holds finished downloads and the shared folder        |
| NextExplorer        | It is the download location | `exists`                          | `data`: the download folder read-write, the shared folder read-only | Holds finished downloads and the shared folder        |
| Lidarr              | Lidarr Automation is on     | `running`, health check `primary` | `startos`, subpath `share`, read-only                               | Supplies the missing-album list and imports downloads |

The file manager only has to be installed, not running. If it is uninstalled, slskd refuses to start with a message naming it. Lidarr is reached at its bridge address on its `ui-multi` host, port 8686, with the key it publishes in `share/api-key`. While Lidarr is uninstalled, the Soularr daemon is not started and the `lidarr` health check reports it.

## Network Access and Interfaces

Two interfaces: the web UI and the Soulseek peer port.

| Interface      | Id     | Type | Port  | Protocol | Purpose                                        |
| -------------- | ------ | ---- | ----- | -------- | ---------------------------------------------- |
| Web UI         | `ui`   | ui   | 5030  | HTTP     | The slskd web interface and its API            |
| Soulseek Peers | `peer` | p2p  | 50300 | Raw TCP  | Incoming connections from other Soulseek users |

The peer port's external port must also be 50300: slskd reports its listen port to the Soulseek server, and other users dial that number. When another service already holds 50300, the Soulseek Network health check says so. Without incoming connections, slskd still works, with fewer search results and some users unreachable.

slskd connects out to the Soulseek server (`vps.slsknet.org`, port 2271) and directly to other users, so they learn the server's outgoing IP address. The API keys work only from inside the package, so the API cannot be used through these interfaces with a key; a browser session signed in as `admin` can use it.

## Installation and First-Run Flow

slskd's default `slskd`/`slskd` login is never active: the package writes its own credentials before slskd first starts.

1. Init generates the JWT signing key and both API keys and stores them in `store.json`.
2. Three critical tasks hold the service until the admin password, the Soulseek account, and the download location are set (see [Tasks](#tasks)).
3. On start, the package writes `slskd.yml`, prepares the download folder, and starts slskd.

A Soulseek username that does not exist yet is registered by the Soulseek server on its first login, with the password supplied. Lidarr Automation starts off.

## Actions

Every action saves to `store.json`, and the change takes effect on the next start. Saving any of them while the service runs restarts it, which interrupts transfers in progress.

- **Set Admin Password / Reset Admin Password** — Run at install, and again to rotate the password. It generates a 32-character password and a new JWT signing key, and returns the username `admin` and the password. Each run replaces the previous password and signs out every browser session.
- **Soulseek Account** — Run at install, or when the Soulseek Network check reports a refused login. It sets the Soulseek username and password. The password field is pre-filled with a random value. Safe to repeat.
- **Download Location** — Run at install, or to move downloads. It chooses FileBrowser Quantum or NextExplorer and a folder in it; the folder is created if missing. Files already downloaded stay where they are. It refuses a folder that is, contains, or sits inside the shared folder.
- **Sharing** — Run to share a folder, or clear the field to stop sharing. The folder must already exist in the same file manager as the download location. slskd scans it after the restart; a large library takes a while to scan. It refuses a folder that is, contains, or sits inside the download folder.
- **Transfer Limits** — Run to cap upload or download slots or bandwidth, for example when Soulseek traffic slows the rest of your network. Upload slots default to 10; the other limits are empty, meaning unlimited. Safe to repeat.
- **Lidarr Automation** — Turns Soularr on or off and sets what it searches for and accepts: preferred file types, music files only, artist in searches, filename match, which albums to search for, albums per check, and the wait between passes. Raise the filename match or turn on artist searches when Soularr picks wrong albums; lower them when it finds too little. Turning it on declares Lidarr as a running dependency and adds the `soularr` API key to `slskd.yml`; turning it off removes both. Safe to repeat.

## Tasks

Three critical tasks are raised at install. Each blocks the service from starting until its action is run, and each returns if its value is ever missing from `store.json`.

| Action             | Raised while                               | Cleared by                 |
| ------------------ | ------------------------------------------ | -------------------------- |
| Set Admin Password | No admin password is stored                | Running Set Admin Password |
| Soulseek Account   | No Soulseek username or password is stored | Saving Soulseek Account    |
| Download Location  | No download location is stored             | Saving Download Location   |

## Health Checks

Up to four checks appear, depending on the configuration.

| Check             | Id         | Shown                                            | Probes                                                                                 |
| ----------------- | ---------- | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Web Interface     | `primary`  | Always                                           | `GET /health` on port 5030                                                             |
| Soulseek Network  | `soulseek` | Always                                           | `GET /api/v0/application` with the `startos` key; reads the server login state         |
| Sharing           | `sharing`  | A shared folder is set                           | Whether the folder existed at start (checked once)                                     |
| Lidarr Automation | `soularr`  | Lidarr Automation is on                          | Lidarr's `system/status`, then whether Lidarr's file listing shows the download folder |
| Lidarr Automation | `lidarr`   | Lidarr Automation is on but Lidarr is not usable | Reports that Lidarr is not installed, or has not published its API key                 |

- **Soulseek Network** has a 60-second grace period. "Connecting" between retries is normal right after a start. "Connected, but the login was refused" means the username belongs to someone else or the password is wrong: change them in Soulseek Account. "Not connected" means slskd cannot reach the Soulseek server; slskd keeps retrying on its own, waiting longer after each failure (up to about 5 minutes), so restarting slskd reconnects sooner once the network is back. "slskd has stopped retrying" means slskd's reconnect watchdog is off (`connectionWatchdog.isEnabled` is false in `/api/v0/application`). slskd turns it off after three disconnects, which its log names: "disconnected by the user" (the web interface's disconnect control), "invalid username or password", or "another client logged in using the same username". It stays offline until someone connects again in the web interface or restarts slskd. A success message that mentions a different peer port means incoming connections cannot reach slskd until port 50300 is free.
- **Sharing** failing means the folder was not found, so nothing is shared. Create the folder in the file manager, then restart slskd.
- **Lidarr Automation** (`soularr`) failing with "cannot see" means Lidarr does not mount the same file manager, so it cannot import: select that file manager in Lidarr's Media Storage action. "Cannot reach Lidarr" or an HTTP code means Lidarr is down or its key changed; a key change restarts slskd automatically.

## Backups and Restore

Both volumes are copied whole with `ofVolumes`, excluding `slskd/incomplete`, `slskd/downloads` (unused, since downloads go to the file manager), `slskd/logs`, and `slskd/data/backups` (slskd's own share-cache backups, rebuilt by a scan).

Finished downloads and the shared folder live in the file manager and are backed up with it, not here. A restore brings back the credentials, keys, settings, slskd's databases (transfer and search history), and Soularr's state. Incomplete downloads are lost and start over. Restore the file manager, and Lidarr if Lidarr Automation was on, so that the next start finds them.

## Limitations and Differences

1. slskd options that no action sets cannot be changed: remote configuration is off and `slskd.yml` is rewritten on every start. This covers per-user upload limits, user groups, blacklists, integrations (webhooks, scripts, FTP, Pushbullet), chat rooms, and the user profile.
2. Downloads go only to FileBrowser Quantum or NextExplorer; there is no download folder on the package's own volume.
3. One shared folder, in the same file manager as the download location, and not overlapping the download folder. Whether it exists is checked only at start.
4. You cannot add your own slskd API keys, and the package's keys work only from inside the package, so external tools (such as Lidarr plugins) cannot connect with a key.
5. Soularr's web UI is not included: it has no login and shows both API keys. Soularr settings that Lidarr Automation does not set, such as blacklists and accepted release countries, use its built-in defaults.
6. The admin username is always `admin`.
7. slskd's own HTTPS listener is off and its web listener is IPv4-only inside the container.
8. The peer port must be reachable at external port 50300 for incoming connections. Soulseek cannot run over Tor: peers connect by IP address.

---

## Quick Reference for AI Consumers

```yaml
package_id: slskd
image: slskd/slskd
architectures: [x86_64, aarch64]
subcontainers: [slskd-sub, soularr-sub]
volumes:
  startos: (store.json, not mounted)
  main/slskd: /app
  main/soularr: /data
file_models:
  - startos:/store.json
  - main:/slskd/slskd.yml
  - main:/soularr/config.ini
startos_managed_env_vars:
  - PUID
  - PGID
  - TZ
  - SOULARR_INTERVAL
dependencies: [filebrowser, nextexplorer, lidarr]
interfaces:
  ui: { type: ui, port: 5030 }
  peer: { type: p2p, port: 50300 }
actions:
  - set-admin-password
  - soulseek-account
  - download-location
  - sharing
  - transfer-limits
  - lidarr-automation
tasks:
  - { action: set-admin-password, severity: critical }
  - { action: soulseek-account, severity: critical }
  - { action: download-location, severity: critical }
health_checks:
  - primary
  - soulseek
  - sharing
  - soularr
  - lidarr
```
