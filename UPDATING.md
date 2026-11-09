# Updating the upstream version

This package pins three upstream sources: the slskd Docker image, and the Soularr commit and Python base image the `soularr` image is built from.

The **Check upstream** workflow runs every Monday and opens an issue when slskd publishes a newer stable release, saying whether its image is on Docker Hub for both architectures, or when Soularr publishes a release newer than the pinned commit; it doesn't watch the Python base image. GitHub pauses scheduled workflows in a public repository after 60 days without activity; re-enable it from the repository's **Actions** tab.

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

## Releasing

1. Set `version` in `startos/versions/current.ts` and update `releaseNotes` in all five locales. A new slskd release is `<X.Y.Z>:0`. A Soularr or Python base image bump, or any other packaging change that should reach users, raises the revision after the colon (`0.26.2:1` → `0.26.2:2`). If `current.ts` carries a migration (an `up` that does work), first move that version to its own file, as the packaging guide's `versions.md` describes.
2. Commit and push `master`. Nothing else is needed.

The **Tag and Release** workflow runs on every push to `master` that changes more than Markdown. It reads the package id and `version` from `startos/versions/current.ts` and asks the registry in the `REFERENCE_REGISTRY` repository variable whether that version exists. If it does, the run stops; a push that doesn't change the version publishes nothing. Otherwise it force-pushes the tag `v` plus the version with `:` replaced by `_` (`0.26.2:1` → `v0.26.2_1`), builds both architectures, creates the GitHub Release with the `.s9pk` files, and adds them to the registry in `RELEASE_REGISTRY`, which downloads them from the release. It signs with the `DEV_KEY` repository secret, a CI key that registry authorizes to publish this package.

- A push that bumps the version reaches users right away, so push the bump only after the change works on a box.
- Keep `version` a quoted string literal; the workflow reads it from the file's text.
- A published version is never rebuilt, so every change that should reach users needs a new version.
- The **Release** workflow also builds and publishes when a `v*.*` tag is pushed by hand. The tag pushed by Tag and Release doesn't trigger it.
