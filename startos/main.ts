import { FileHelper, T } from '@start9labs/start-sdk'
import { access, mkdir } from 'fs/promises'
import { configIni } from './fileModels/config.ini'
import { SlskdYml, slskdYml } from './fileModels/slskd.yml'
import { storeJson } from './fileModels/store.json'
import { lidarrStatus, soulseekStatus } from './health'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  adminUsername,
  appDir,
  bridgeOnly,
  cleanFolder,
  FileManager,
  fileManagers,
  fileManagerTitles,
  lidarrHostId,
  lidarrPort,
  localhostOnly,
  peerHostId,
  peerPort,
  soularrDataDir,
  uiPort,
} from './utils'

// Signals stop the running pass at once instead of after the interval.
const soularrLoop = `trap 'kill "$child" 2>/dev/null; exit 0' TERM INT
while :; do
  python -u /app/soularr.py & child=$!
  wait "$child"
  sleep "$SOULARR_INTERVAL" & child=$!
  wait "$child"
done`

const pyBool = (value: boolean) => (value ? 'True' : 'False')

async function folderExists(
  effects: T.Effects,
  dependencyId: FileManager,
  subpath: string,
) {
  // A read-only mount of a missing subpath fails rather than creating it.
  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'slskd' },
    sdk.Mounts.of().mountDependency({
      dependencyId,
      volumeId: 'data',
      subpath,
      mountpoint: '/check',
      readonly: true,
    }),
    'share-check',
    async () => true,
  ).catch(() => false)
}

const lidarrShare = sdk.volumes.startos.subpath('lidarr-share')
const lidarrApiKeyFile = FileHelper.string(`${lidarrShare}/api-key`)

async function readLidarrApiKey(effects: T.Effects) {
  try {
    // Mounting again unmounts first, pulling the file out from under the watcher.
    const mounted = await access(`${lidarrShare}/api-key`).then(
      () => true,
      () => false,
    )
    if (!mounted) {
      await mkdir(lidarrShare, { recursive: true })
      await sdk.mount(effects, {
        location: lidarrShare,
        target: {
          packageId: 'lidarr',
          volumeId: 'startos',
          subpath: 'share',
          readonly: true,
          idmap: [],
        },
      })
    }
    return await lidarrApiKeyFile
      .read(
        (key) => key,
        (prev, next) => next === null || prev === next,
      )
      .const(effects)
  } catch {
    return null
  }
}

// Read by health checks that outlive the build that created them.
const live = {
  assignedPeerPort: null as number | null,
  lidarr: null as {
    address: string
    apiKey: string
    downloadDir: string
    fileManager: string
    minutes: number
  } | null,
}

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting slskd!'))
  return sdk.Daemons.dynamic(effects, (fn) => build(effects, fn.effects))
})

async function build(root: T.Effects, effects: T.Effects) {
  const store = await storeJson.read().const(effects)
  const adminPassword = store?.adminPassword
  const jwtKey = store?.jwtKey
  const startosApiKey = store?.startosApiKey
  const soularrApiKey = store?.soularrApiKey
  const soulseekUsername = store?.soulseekUsername
  const soulseekPassword = store?.soulseekPassword
  const target = store?.downloadTarget
  if (
    !store ||
    !adminPassword ||
    !jwtKey ||
    !startosApiKey ||
    !soularrApiKey ||
    !soulseekUsername ||
    !soulseekPassword ||
    !target
  ) {
    throw new Error('Setup is incomplete: complete the critical tasks first')
  }

  const { mountpoint } = fileManagers[target]
  const fileManager = fileManagerTitles[target]
  const downloadFolder = cleanFolder(
    target === 'filebrowser'
      ? store.filebrowserFolder
      : store.nextexplorerFolder,
  )
  const downloadDir = `${mountpoint}/${downloadFolder}`

  const installed = await sdk
    .getServiceManifest(effects, target, (m) => m !== null)
    .const()
  if (!installed) {
    throw new Error(
      i18n(
        '${fileManager} is not installed. Install it, or choose another file manager in Download Folder.',
        { fileManager },
      ),
    )
  }

  const shareFolder = store.shareFolder ? cleanFolder(store.shareFolder) : null
  const shareDir = shareFolder ? `${mountpoint}/${shareFolder}` : null
  const shareFound = shareFolder
    ? await folderExists(effects, target, shareFolder)
    : false

  live.assignedPeerPort = await sdk.host
    .getOwn(
      effects,
      peerHostId,
      (host) => host?.bindings[peerPort]?.net.assignedPort ?? null,
    )
    .const()

  const pluginApiKey = store.lidarrPluginEnabled ? store.pluginApiKey : null

  const yml: SlskdYml = {
    remote_configuration: false,
    remote_file_management: false,
    flags: { no_version_check: true },
    directories: { downloads: downloadDir, incomplete: `${appDir}/incomplete` },
    shares: { directories: shareDir && shareFound ? [shareDir] : [] },
    web: {
      port: uiPort,
      ip_address: '0.0.0.0',
      https: { disabled: true },
      authentication: {
        disabled: false,
        username: adminUsername,
        password: adminPassword,
        jwt: { key: jwtKey, ttl: 604800000 },
        api_keys: {
          startos: {
            key: startosApiKey,
            role: 'readonly',
            cidr: localhostOnly,
          },
          ...(store.soularrEnabled
            ? {
                soularr: {
                  key: soularrApiKey,
                  role: 'readwrite' as const,
                  cidr: localhostOnly,
                },
              }
            : {}),
          // Tubifarry's connection test reads /api/v0/options, which slskd reserves for administrators.
          ...(pluginApiKey
            ? {
                lidarr: {
                  key: pluginApiKey,
                  role: 'administrator' as const,
                  cidr: bridgeOnly,
                },
              }
            : {}),
        },
      },
    },
    soulseek: {
      username: soulseekUsername,
      password: soulseekPassword,
      listen_ip_address: '0.0.0.0',
      listen_port: peerPort,
    },
    // An absent limit is slskd's own default: unlimited.
    transfers: {
      upload: {
        slots: store.uploadSlots,
        ...(store.uploadSpeedLimit !== null
          ? { speed_limit: store.uploadSpeedLimit }
          : {}),
      },
      download: {
        ...(store.downloadSlots !== null ? { slots: store.downloadSlots } : {}),
        ...(store.downloadSpeedLimit !== null
          ? { speed_limit: store.downloadSpeedLimit }
          : {}),
      },
    },
  }
  await slskdYml.write(effects, yml)

  let slskdMounts = sdk.Mounts.of()
    .mountVolume({
      volumeId: 'main',
      subpath: 'slskd',
      mountpoint: appDir,
      readonly: false,
    })
    .mountDependency({
      dependencyId: target,
      volumeId: 'data',
      subpath: downloadFolder,
      mountpoint: downloadDir,
      readonly: false,
    })
  if (shareFolder && shareDir && shareFound) {
    slskdMounts = slskdMounts.mountDependency({
      dependencyId: target,
      volumeId: 'data',
      subpath: shareFolder,
      mountpoint: shareDir,
      readonly: true,
    })
  }

  const slskdSub = sdk.SubContainer.of(
    effects,
    { imageId: 'slskd' },
    slskdMounts,
    'slskd-sub',
  )

  const minutes = store.soularrIntervalMinutes
  let soularrSub: typeof slskdSub | null = null
  let lidarrProblem: 'missing' | 'key' | null = null
  live.lidarr = null

  if (store.soularrEnabled) {
    const lidarrAddress = await sdk.host
      .getBridgeAddress(effects, {
        packageId: 'lidarr',
        hostId: lidarrHostId,
        internalPort: lidarrPort,
        ssl: false,
      })
      .const()
    const lidarrApiKey = lidarrAddress ? await readLidarrApiKey(effects) : null

    if (!lidarrAddress) {
      lidarrProblem = 'missing'
    } else if (!lidarrApiKey) {
      lidarrProblem = 'key'
    } else {
      // Soularr reads this file at the start of every pass.
      await configIni.write(effects, {
        Lidarr: {
          api_key: lidarrApiKey,
          host_url: `http://${lidarrAddress}`,
          download_dir: downloadDir,
        },
        Slskd: {
          api_key: soularrApiKey,
          host_url: `http://127.0.0.1:${uiPort}`,
          url_base: '/',
          download_dir: downloadDir,
        },
        'Search Settings': {
          allowed_filetypes: store.soularrFiletypes,
          search_type: 'incrementing_page',
          search_source: store.soularrSearchSource,
          number_of_albums_to_grab: String(store.soularrAlbumsPerCheck),
          minimum_filename_match_ratio: String(store.soularrMatchRatio),
          album_prepend_artist: pyBool(store.soularrSearchWithArtist),
        },
        'Download Settings': {
          download_filtering: pyBool(store.soularrMusicFilesOnly),
        },
        Logging: { log_to_file: 'False' },
      })
      live.lidarr = {
        address: lidarrAddress,
        apiKey: lidarrApiKey,
        downloadDir,
        fileManager,
        minutes,
      }
      soularrSub = sdk.SubContainer.of(
        effects,
        { imageId: 'soularr' },
        sdk.Mounts.of()
          .mountVolume({
            volumeId: 'main',
            subpath: 'soularr',
            mountpoint: soularrDataDir,
            readonly: false,
          })
          .mountDependency({
            dependencyId: target,
            volumeId: 'data',
            subpath: downloadFolder,
            mountpoint: downloadDir,
            readonly: false,
          }),
        'soularr-sub',
      )
    }
  }

  return sdk.Daemons.of(effects)
    .addOneshot('prepare-downloads', {
      subcontainer: slskdSub,
      exec: { command: ['chown', '1000:1000', downloadDir], user: 'root' },
      requires: [],
    })
    .addDaemon('primary', {
      subcontainer: slskdSub,
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: { PUID: '1000', PGID: '1000', TZ: 'Etc/UTC' },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            root,
            `http://127.0.0.1:${uiPort}/health`,
            {
              successMessage: i18n('The web interface is ready'),
              errorMessage: i18n('The web interface is not ready'),
            },
          ),
      },
      requires: ['prepare-downloads'],
      // slskd restarts when its configuration changes; the checks that require it restart with it.
      uses: { yml, shareFolder },
    })
    .addHealthCheck('soulseek', {
      ready: {
        display: i18n('Soulseek Network'),
        gracePeriod: 60_000,
        fn: () =>
          soulseekStatus(
            startosApiKey,
            soulseekUsername,
            live.assignedPeerPort,
          ),
      },
      requires: ['primary'],
    })
    .addHealthCheck('sharing', () =>
      shareFolder
        ? {
            ready: {
              display: i18n('Sharing'),
              gracePeriod: 0,
              trigger: sdk.trigger.onceTrigger,
              fn: () =>
                shareFound
                  ? {
                      result: 'success' as const,
                      message: i18n('Sharing ${folder}, read-only', {
                        folder: shareFolder,
                      }),
                    }
                  : {
                      result: 'failure' as const,
                      message: i18n(
                        '${folder} was not found in ${fileManager}, so nothing is shared. Create it, then restart slskd.',
                        { folder: shareFolder, fileManager },
                      ),
                    },
            },
            requires: ['primary'],
          }
        : null,
    )
    .addHealthCheck('lidarr-missing', () =>
      lidarrProblem === 'missing'
        ? {
            ready: {
              display: i18n('Lidarr Automation'),
              gracePeriod: 0,
              trigger: sdk.trigger.onceTrigger,
              fn: () => ({
                result: 'failure' as const,
                message: i18n('Lidarr is not installed'),
              }),
            },
            requires: [],
          }
        : null,
    )
    .addHealthCheck('lidarr-key', () =>
      lidarrProblem === 'key'
        ? {
            ready: {
              display: i18n('Lidarr Automation'),
              gracePeriod: 0,
              trigger: sdk.trigger.onceTrigger,
              fn: () => ({
                result: 'failure' as const,
                message: i18n(
                  'Lidarr has not shared its API key. Update Lidarr, then restart slskd.',
                ),
              }),
            },
            requires: [],
          }
        : null,
    )
    .addOneshot('prepare-soularr', () =>
      soularrSub
        ? {
            subcontainer: soularrSub,
            exec: {
              command: ['chown', '1000:1000', soularrDataDir],
              user: 'root',
            },
            requires: [],
          }
        : null,
    )
    .addDaemon('soularr', () =>
      soularrSub
        ? {
            subcontainer: soularrSub,
            exec: {
              command: ['sh', '-c', soularrLoop],
              user: 'soularr',
              env: { SOULARR_INTERVAL: String(minutes * 60) },
            },
            ready: {
              display: i18n('Lidarr Automation'),
              fn: () =>
                live.lidarr
                  ? lidarrStatus(live.lidarr)
                  : {
                      result: 'starting' as const,
                      message: i18n('Waiting for slskd'),
                    },
            },
            requires: ['primary', 'prepare-soularr'],
          }
        : null,
    )
}
