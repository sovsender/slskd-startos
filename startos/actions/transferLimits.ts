import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  uploadSlots: Value.number({
    name: i18n('Upload Slots'),
    description: i18n('How many uploads to other users can run at once.'),
    default: 10,
    required: true,
    min: 1,
    max: 1000,
    integer: true,
  }),
  uploadSpeedLimit: Value.number({
    name: i18n('Upload Speed Limit'),
    description: i18n(
      'Total upload speed for all uploads. Empty means no limit.',
    ),
    default: null,
    required: false,
    min: 1,
    integer: true,
    units: 'KiB/s',
  }),
  downloadSlots: Value.number({
    name: i18n('Download Slots'),
    description: i18n(
      'How many downloads can run at once. Empty means no limit.',
    ),
    default: null,
    required: false,
    min: 1,
    integer: true,
  }),
  downloadSpeedLimit: Value.number({
    name: i18n('Download Speed Limit'),
    description: i18n(
      'Total download speed for all downloads. Empty means no limit.',
    ),
    default: null,
    required: false,
    min: 1,
    integer: true,
    units: 'KiB/s',
  }),
})

export const transferLimits = sdk.Action.withInput(
  'transfer-limits',

  async () => ({
    name: i18n('Transfer Limits'),
    description: i18n(
      'Limit how many transfers run at once and how much bandwidth they use. Saving restarts slskd.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const store = await storeJson.read().const(effects)
    return {
      uploadSlots: store?.uploadSlots ?? 10,
      uploadSpeedLimit: store?.uploadSpeedLimit ?? null,
      downloadSlots: store?.downloadSlots ?? null,
      downloadSpeedLimit: store?.downloadSpeedLimit ?? null,
    }
  },

  async ({ effects, input }) =>
    storeJson.merge(effects, {
      uploadSlots: input.uploadSlots,
      uploadSpeedLimit: input.uploadSpeedLimit,
      downloadSlots: input.downloadSlots,
      downloadSpeedLimit: input.downloadSpeedLimit,
    }),
)
