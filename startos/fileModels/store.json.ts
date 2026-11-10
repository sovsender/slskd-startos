import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const nullableString = z.string().nullable().catch(null)

const shape = z.looseObject({
  adminPassword: nullableString,
  jwtKey: nullableString,
  startosApiKey: nullableString,
  soularrApiKey: nullableString,
  pluginApiKey: nullableString,
  soulseekUsername: nullableString,
  soulseekPassword: nullableString,
  downloadTarget: z
    .enum(['filebrowser', 'nextexplorer'])
    .nullable()
    .catch(null),
  filebrowserFolder: z.string().catch('slskd'),
  nextexplorerFolder: z.string().catch('Files/slskd'),
  shareFolder: nullableString,
  soularrEnabled: z.boolean().catch(false),
  lidarrPluginEnabled: z.boolean().catch(false),
  soularrFiletypes: z.string().catch('flac,mp3 320'),
  soularrIntervalMinutes: z.number().catch(5),
  soularrSearchSource: z
    .enum(['missing', 'cutoff_unmet', 'all'])
    .catch('missing'),
  soularrSearchWithArtist: z.boolean().catch(false),
  soularrMatchRatio: z.number().catch(0.8),
  soularrMusicFilesOnly: z.boolean().catch(true),
  soularrAlbumsPerCheck: z.number().catch(10),
  uploadSlots: z.number().catch(10),
  uploadSpeedLimit: z.number().nullable().catch(null),
  downloadSlots: z.number().nullable().catch(null),
  downloadSpeedLimit: z.number().nullable().catch(null),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: '/store.json' },
  shape,
)

export type StoreType = z.infer<typeof shape>
