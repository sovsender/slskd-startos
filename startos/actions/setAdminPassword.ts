import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { adminUsername } from '../utils'

export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',

  async ({ effects }) => {
    const alreadySet = !!(await storeJson
      .read((s) => s.adminPassword)
      .const(effects))
    return {
      name: alreadySet
        ? i18n('Reset Admin Password')
        : i18n('Set Admin Password'),
      description: i18n(
        'Generate a new random password for the slskd web interface.',
      ),
      warning: alreadySet
        ? i18n(
            'Replaces the current admin password. The old password stops working, and slskd restarts.',
          )
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const adminPassword = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    })
    // A new signing key ends every session signed in with the old password.
    const jwtKey = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 48 })
    await storeJson.merge(effects, { adminPassword, jwtKey })

    return {
      version: '1',
      title: i18n('Login Credentials'),
      message: i18n('Use these credentials to sign in to slskd.'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: adminUsername,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: adminPassword,
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
