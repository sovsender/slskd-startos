import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value, Variants } = sdk

const inputSpec = InputSpec.of({
  mode: Value.union({
    name: i18n('Lidarr Automation'),
    description: i18n(
      'When on, Soularr regularly reads the albums Lidarr is missing, downloads them through slskd, and asks Lidarr to import them. Lidarr then renames and moves them using its own Media Management settings.',
    ),
    default: 'off',
    variants: Variants.of({
      off: { name: i18n('Off'), spec: InputSpec.of({}) },
      on: {
        name: i18n('On'),
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
    name: i18n('Lidarr Automation'),
    description: i18n(
      'Let Soularr fetch the albums Lidarr wants from Soulseek. Requires Lidarr, using the same file manager as slskd. Saving restarts slskd.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const store = await storeJson.read().const(effects)
    const on = {
      filetypes: store?.soularrFiletypes ?? 'flac,mp3 320',
      musicFilesOnly: store?.soularrMusicFilesOnly ?? true,
      searchWithArtist: store?.soularrSearchWithArtist ?? false,
      matchRatio: store?.soularrMatchRatio ?? 0.8,
      searchSource: store?.soularrSearchSource ?? 'missing',
      albumsPerCheck: store?.soularrAlbumsPerCheck ?? 10,
      intervalMinutes: store?.soularrIntervalMinutes ?? 5,
    }
    return {
      mode: store?.soularrEnabled
        ? { selection: 'on' as const, value: on }
        : { selection: 'off' as const, value: {}, other: { on } },
    }
  },

  async ({ effects, input }) => {
    if (input.mode.selection === 'off') {
      return storeJson.merge(effects, { soularrEnabled: false })
    }
    const on = input.mode.value
    return storeJson.merge(effects, {
      soularrEnabled: true,
      soularrFiletypes: on.filetypes,
      soularrMusicFilesOnly: on.musicFilesOnly,
      soularrSearchWithArtist: on.searchWithArtist,
      soularrMatchRatio: on.matchRatio,
      soularrSearchSource: on.searchSource,
      soularrAlbumsPerCheck: on.albumsPerCheck,
      soularrIntervalMinutes: on.intervalMinutes,
    })
  },
)
