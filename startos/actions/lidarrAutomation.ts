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
      intervalMinutes: store?.soularrIntervalMinutes ?? 5,
    }
    return {
      mode: store?.soularrEnabled
        ? { selection: 'on' as const, value: on }
        : { selection: 'off' as const, value: {}, other: { on } },
    }
  },

  async ({ effects, input }) =>
    storeJson.merge(
      effects,
      input.mode.selection === 'on'
        ? {
            soularrEnabled: true,
            soularrFiletypes: input.mode.value.filetypes,
            soularrIntervalMinutes: input.mode.value.intervalMinutes,
          }
        : { soularrEnabled: false },
    ),
)
