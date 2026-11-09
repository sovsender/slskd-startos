import { downloadLocation } from '../actions/downloadLocation'
import { setAdminPassword } from '../actions/setAdminPassword'
import { soulseekAccount } from '../actions/soulseekAccount'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const tasks = sdk.setupOnInit(async (effects) => {
  const store = await storeJson.read().const(effects)
  if (!store?.adminPassword) {
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n('Set the admin password before signing in'),
    })
  }
  if (!store?.soulseekUsername || !store.soulseekPassword) {
    await sdk.action.createOwnTask(effects, soulseekAccount, 'critical', {
      reason: i18n('Choose the account slskd uses on the Soulseek network'),
    })
  }
  if (!store?.downloadTarget) {
    await sdk.action.createOwnTask(effects, downloadLocation, 'critical', {
      reason: i18n('Choose where slskd saves downloads'),
    })
  }
})
