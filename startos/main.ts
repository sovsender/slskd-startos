import { FileHelper, T } from '@start9labs/start-sdk'
import { configIni } from './fileModels/config.ini'
import { slskdYml } from './fileModels/slskd.yml'
import { storeJson } from './fileModels/store.json'
import { lidarrStatus, soulseekStatus } from './health'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  adminUsername,
  appDir,
  cleanFolder,
  FileManager,
  fileManagers,
  fileManagerTitles,
  lidarrHostId,
  lidarrPort,
  lidarrShareMountpoint,
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

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting slskd!'))

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
        '${fileManager} is not installed. Install it, or choose another download location.',
        { fileManager },
      ),
    )
  }

  const shareFolder = store.shareFolder ? cleanFolder(store.shareFolder) : null
  const shareDir = shareFolder ? `${mountpoint}/${shareFolder}` : null
  const shareFound = shareFolder
    ? await folderExists(effects, target, shareFolder)
    : false

  const assignedPeerPort = await sdk.host
    .getOwn(
      effects,
      peerHostId,
      (host) => host?.bindings[peerPort]?.net.assignedPort ?? null,
    )
    .const()

  await slskdYml.write(effects, {
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
        },
      },
    },
    soulseek: {
      username: soulseekUsername,
      password: soulseekPassword,
      listen_ip_address: '0.0.0.0',
      listen_port: peerPort,
    },
  })

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

  let soularr: {
    sub: typeof slskdSub
    lidarrAddress: string
    lidarrApiKey: string
  } | null = null
  let lidarrProblem: string | null = null

  if (store.soularrEnabled) {
    const lidarrAddress = await sdk.host
      .getBridgeAddress(effects, {
        packageId: 'lidarr',
        hostId: lidarrHostId,
        internalPort: lidarrPort,
        ssl: false,
      })
      .const()

    if (!lidarrAddress) {
      lidarrProblem = i18n('Lidarr is not installed')
    } else {
      const sub = sdk.SubContainer.of(
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
          })
          .mountDependency({
            dependencyId: 'lidarr',
            volumeId: 'startos',
            subpath: 'share',
            mountpoint: lidarrShareMountpoint,
            readonly: true,
          }),
        'soularr-sub',
      )

      const lidarrApiKey = await FileHelper.string(
        `${await sub.rootfs}${lidarrShareMountpoint}/api-key`,
      )
        .read(
          (key) => key,
          (prev, next) => next === null || prev === next,
        )
        .const(effects)

      if (!lidarrApiKey) {
        lidarrProblem = i18n(
          'Lidarr has not shared its API key. Update Lidarr, then restart slskd.',
        )
      } else {
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
            number_of_albums_to_grab: '10',
          },
          Logging: { log_to_file: 'False' },
        })
        soularr = { sub, lidarrAddress, lidarrApiKey }
      }
    }
  }

  const minutes = store.soularrIntervalMinutes

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
            effects,
            `http://127.0.0.1:${uiPort}/health`,
            {
              successMessage: i18n('The web interface is ready'),
              errorMessage: i18n('The web interface is not ready'),
            },
          ),
      },
      requires: ['prepare-downloads'],
    })
    .addHealthCheck('soulseek', {
      ready: {
        display: i18n('Soulseek Network'),
        gracePeriod: 60_000,
        fn: () =>
          soulseekStatus(startosApiKey, soulseekUsername, assignedPeerPort),
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
    .addHealthCheck('lidarr', () =>
      lidarrProblem
        ? {
            ready: {
              display: i18n('Lidarr Automation'),
              gracePeriod: 0,
              trigger: sdk.trigger.onceTrigger,
              fn: () => ({
                result: 'failure' as const,
                message: lidarrProblem ?? '',
              }),
            },
            requires: [],
          }
        : null,
    )
    .addOneshot('prepare-soularr', () =>
      soularr
        ? {
            subcontainer: soularr.sub,
            exec: {
              command: ['chown', '1000:1000', soularrDataDir],
              user: 'root',
            },
            requires: [],
          }
        : null,
    )
    .addDaemon('soularr', () => {
      if (!soularr) return null
      const { lidarrAddress, lidarrApiKey } = soularr
      return {
        subcontainer: soularr.sub,
        exec: {
          command: ['sh', '-c', soularrLoop],
          user: 'soularr',
          env: { SOULARR_INTERVAL: String(minutes * 60) },
        },
        ready: {
          display: i18n('Lidarr Automation'),
          fn: () =>
            lidarrStatus(
              lidarrAddress,
              lidarrApiKey,
              downloadDir,
              fileManager,
              minutes,
            ),
        },
        requires: ['primary', 'prepare-soularr'],
      }
    })
})
