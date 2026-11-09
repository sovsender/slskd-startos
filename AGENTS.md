# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## Traps in this package

- The download folder is mounted at `/mnt/filebrowser/<folder>` or `/mnt/nextexplorer/<folder>`
  because Lidarr mounts those file managers at the same roots. Soularr passes the slskd path to
  Lidarr unchanged, so changing a mountpoint here breaks imports.
- The slskd API keys are limited to localhost. The package's JavaScript and the Soularr
  subcontainer reach slskd at `127.0.0.1:5030`, which works because they share one network
  namespace with `slskd-sub`.
- Soularr's config parser expands `$`. Any user text written into `config.ini` must exclude it,
  which is what `folderPattern` and the file-type pattern enforce.
- `web.ip_address` is `0.0.0.0` because slskd's default `[::]` aborts where IPv6 is unavailable.
- Soularr's web UI is deliberately left out of the image: it has no authentication and its
  `/api/config` returns both API keys.
