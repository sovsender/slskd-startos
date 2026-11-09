# Updating the upstream version

This package pins three upstream sources: the slskd Docker image, and the Soularr commit and Python base image the `soularr` image is built from.

## slskd

### Determining the upstream version

The pin is `images.slskd.source.dockerTag` in `startos/manifest/index.ts`. List upstream's release tags, which match the image tags:

```sh
git ls-remote --tags https://github.com/slskd/slskd | awk -F/ '{print $3}' | grep -v '\^{}' | sort -V | tail -5
```

Use a plain `X.Y.Z` tag. Tags like `0.26.2.65534-<hash>` and `canary` are development builds.

### Applying the bump

Set `dockerTag` to `slskd/slskd:<X.Y.Z>`. Read the release notes for changes to `slskd.yml` keys or API key roles the package relies on (see the README's File Models section).

## Soularr

### Determining the upstream version

The pin is the `SOULARR_COMMIT` build argument in `soularr.Dockerfile`. Find the commit behind the latest release tag:

```sh
git ls-remote --tags https://github.com/mrusse/soularr | sort -t/ -k3 -V | tail -3
```

### Applying the bump

Set `SOULARR_COMMIT` to the full commit hash of the new tag. Check that `soularr.py` still reads the `config.ini` keys the package writes, and whether `requirements.txt` gained a package the script now imports.

## Python base image

### Determining the upstream version

The pin is the digest on the `FROM python:3.11-slim@sha256:…` line in `soularr.Dockerfile`. Read the current digest of the tag, which Docker refreshes with Debian security updates:

```sh
curl -fsS https://hub.docker.com/v2/repositories/library/python/tags/3.11-slim | jq -r .digest
```

### Applying the bump

Replace the digest after `@`. Move to a newer Python minor version only after checking that Soularr's pinned requirements install on it.
