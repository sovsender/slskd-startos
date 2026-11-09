import { T } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import {
  filebrowserDescription,
  lidarrDescription,
  nextexplorerDescription,
} from './manifest/i18n'
import { sdk } from './sdk'
import { FileManager } from './utils'

type Enabled = (options: { effects: T.Effects }) => Promise<boolean>

const target =
  (id: FileManager): Enabled =>
  async ({ effects }) =>
    (await storeJson.read((s) => s.downloadTarget).const(effects)) === id

// File managers are `exists`: slskd writes into their data volume whether or not they run.
export const dependencies = sdk.Dependencies.of()
  .addDependency(
    sdk.Dependency.optional('filebrowser', {
      description: filebrowserDescription,
      metadata: {
        title: 'FileBrowser Quantum',
        icon: 'https://raw.githubusercontent.com/Start9Labs/filebrowser-quantum-startos/e936a6c85a97b930b43cad5e9c0dd4898a2df567/icon.svg',
      },
      versionRange: '>=2.63.18:3 || >=#quantum:1.5.2:0',
      kind: 'exists',
      enabled: target('filebrowser'),
    }),
  )
  .addDependency(
    sdk.Dependency.optional('nextexplorer', {
      description: nextexplorerDescription,
      metadata: {
        title: 'NextExplorer',
        icon: 'https://raw.githubusercontent.com/Start9Labs/nextexplorer-startos/04f7ecbfc31ad2205e0222dd7568fb881aa06c79/icon.svg',
      },
      versionRange: '>=2.2.7:0',
      kind: 'exists',
      enabled: target('nextexplorer'),
    }),
  )
  .addDependency(
    sdk.Dependency.optional('lidarr', {
      description: lidarrDescription,
      metadata: {
        title: 'Lidarr',
        icon: 'https://raw.githubusercontent.com/sovsender/lidarr-startos/db8f422cc30ed963c58cb8a1130f5af78b0cdbd0/icon.png',
      },
      versionRange: '>=3.1.6.5079:0',
      kind: 'running',
      healthChecks: ['primary'],
      enabled: async ({ effects }) =>
        (await storeJson.read((s) => s.soularrEnabled).const(effects)) ?? false,
    }),
  )
