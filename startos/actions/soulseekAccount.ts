import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: i18n('Soulseek Username'),
    description: i18n(
      'The name other Soulseek users see. A new name is registered automatically the first time slskd logs in with it; if it already belongs to someone else, the login fails.',
    ),
    default: null,
    required: true,
    maxLength: 30,
    patterns: [
      {
        regex: '\\S(?:.*\\S)?',
        description: i18n('Cannot start or end with a space'),
      },
    ],
  }),
  password: Value.text({
    name: i18n('Soulseek Password'),
    description: i18n(
      'The password for this Soulseek username. For a new name, any password you choose here becomes its password.',
    ),
    default: { charset: 'a-z,A-Z,0-9', len: 24 },
    required: true,
    masked: true,
    generate: { charset: 'a-z,A-Z,0-9', len: 24 },
  }),
})

export const soulseekAccount = sdk.Action.withInput(
  'soulseek-account',

  async () => ({
    name: i18n('Soulseek Account'),
    description: i18n(
      'Set the username and password slskd uses to log in to the Soulseek network. Accounts are free and need no sign-up. Saving restarts slskd.',
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
      username: store?.soulseekUsername ?? undefined,
      password: store?.soulseekPassword ?? undefined,
    }
  },

  async ({ effects, input }) =>
    storeJson.merge(effects, {
      soulseekUsername: input.username,
      soulseekPassword: input.password,
    }),
)
