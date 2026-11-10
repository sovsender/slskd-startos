import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { uiHostId, uiPort } from '../utils'

const { InputSpec, Value, Variants } = sdk

const inputSpec = InputSpec.of({
  mode: Value.union({
    name: i18n('Method'),
    description: i18n(
      'Lidarr plugin: Lidarr searches and downloads through slskd itself, using the Tubifarry plugin you install in Lidarr. Saving shows the address and API key to enter in Lidarr. Soularr: a helper in this package regularly reads the albums Lidarr is missing, downloads them, and asks Lidarr to import them. Never use both at once.',
    ),
    default: 'off',
    variants: Variants.of({
      off: { name: i18n('Off'), spec: InputSpec.of({}) },
      plugin: { name: i18n('Lidarr plugin'), spec: InputSpec.of({}) },
      soularr: {
        name: 'Soularr',
        spec: InputSpec.of({
          filetypes: Value.text({
            name: i18n('Preferred File Types'),
            description: i18n(
              'Comma-separated, most preferred first. A bitrate or bit depth can follow the format, such as "flac 24/192" or "mp3 320".',
            ),
            default: 'flac,mp3 320',
            required: true,
            placeholder: 'flac,mp3 320',
            patterns: [
              {
                regex: '[^$\\\\\\n]+',
                description: i18n('Cannot use $ or \\'),
              },
            ],
          }),
          musicFilesOnly: Value.toggle({
            name: i18n('Download Only Music Files'),
            description: i18n(
              'Skip the other files in a matching folder, such as cover art, playlists, and logs.',
            ),
            default: true,
          }),
          searchWithArtist: Value.toggle({
            name: i18n('Include Artist in Searches'),
            description: i18n(
              'Search for the artist and album together instead of the album title alone. Fewer wrong matches for common titles, but fewer results.',
            ),
            default: false,
          }),
          matchRatio: Value.number({
            name: i18n('Filename Match'),
            description: i18n(
              "How closely file names must match the album's track titles, from 0.5 (loose) to 1 (exact). Higher values reject more wrong albums, and more correct ones with unusual names.",
            ),
            default: 0.8,
            required: true,
            min: 0.5,
            max: 1,
            step: 0.05,
            integer: false,
          }),
          searchSource: Value.select({
            name: i18n('Albums to Search For'),
            description: i18n(
              "Missing: albums Lidarr does not have. Below cutoff: albums Lidarr has below the quality profile's cutoff. Both: missing ones first.",
            ),
            default: 'missing',
            values: {
              missing: i18n('Missing'),
              cutoff_unmet: i18n('Below cutoff'),
              all: i18n('Both'),
            },
          }),
          albumsPerCheck: Value.number({
            name: i18n('Albums per Check'),
            description: i18n(
              'How many wanted albums Soularr searches for in one pass. Each pass moves on to the next ones.',
            ),
            default: 10,
            required: true,
            min: 1,
            max: 100,
            integer: true,
          }),
          intervalMinutes: Value.number({
            name: i18n('Check Interval'),
            description: i18n(
              'How long Soularr waits after one pass before checking Lidarr again.',
            ),
            default: 5,
            required: true,
            min: 1,
            max: 1440,
            integer: true,
            units: i18n('minutes'),
          }),
        }),
      },
    }),
  }),
})

export const lidarrAutomation = sdk.Action.withInput(
  'lidarr-automation',

  async () => ({
    name: 'Lidarr',
    description: i18n(
      'Download the albums Lidarr wants from Soulseek. Lidarr moves each finished album from the download folder into its own Root Folder. Requires Lidarr, using the same file manager as slskd. Changing the method restarts slskd.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const store = await storeJson.read().const(effects)
    const soularr = {
      filetypes: store?.soularrFiletypes ?? 'flac,mp3 320',
      musicFilesOnly: store?.soularrMusicFilesOnly ?? true,
      searchWithArtist: store?.soularrSearchWithArtist ?? false,
      matchRatio: store?.soularrMatchRatio ?? 0.8,
      searchSource: store?.soularrSearchSource ?? 'missing',
      albumsPerCheck: store?.soularrAlbumsPerCheck ?? 10,
      intervalMinutes: store?.soularrIntervalMinutes ?? 5,
    }
    if (store?.soularrEnabled) {
      return { mode: { selection: 'soularr' as const, value: soularr } }
    }
    return {
      mode: {
        selection: store?.lidarrPluginEnabled
          ? ('plugin' as const)
          : ('off' as const),
        value: {},
        other: { soularr },
      },
    }
  },

  async ({ effects, input }) => {
    if (input.mode.selection === 'off') {
      await storeJson.merge(effects, {
        soularrEnabled: false,
        lidarrPluginEnabled: false,
      })
      return null
    }
    if (input.mode.selection === 'soularr') {
      const soularr = input.mode.value
      await storeJson.merge(effects, {
        soularrEnabled: true,
        lidarrPluginEnabled: false,
        soularrFiletypes: soularr.filetypes,
        soularrMusicFilesOnly: soularr.musicFilesOnly,
        soularrSearchWithArtist: soularr.searchWithArtist,
        soularrMatchRatio: soularr.matchRatio,
        soularrSearchSource: soularr.searchSource,
        soularrAlbumsPerCheck: soularr.albumsPerCheck,
        soularrIntervalMinutes: soularr.intervalMinutes,
      })
      return null
    }

    const apiKey = await storeJson.read((s) => s.pluginApiKey).once()
    const address = await sdk.host
      .getBridgeAddress(effects, {
        hostId: uiHostId,
        internalPort: uiPort,
        ssl: false,
      })
      .once()
    if (!apiKey || !address) {
      throw new Error(
        i18n(
          'slskd has no address or API key yet. Start slskd, then try again.',
        ),
      )
    }
    await storeJson.merge(effects, {
      soularrEnabled: false,
      lidarrPluginEnabled: true,
    })

    return {
      version: '1' as const,
      title: i18n('Connect Lidarr'),
      message: i18n(
        'In Lidarr, install the Tubifarry plugin, then add Slskd under Settings > Indexers and again under Settings > Download Clients. Enter this URL and API key in both. Run this action again to see them later.',
      ),
      result: {
        type: 'group' as const,
        value: [
          {
            type: 'single' as const,
            name: 'URL',
            description: null,
            value: `http://${address}`,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single' as const,
            name: i18n('API Key'),
            description: null,
            value: apiKey,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
