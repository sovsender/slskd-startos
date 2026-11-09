import { sdk } from '../sdk'
import { downloadLocation } from './downloadLocation'
import { lidarrAutomation } from './lidarrAutomation'
import { setAdminPassword } from './setAdminPassword'
import { sharing } from './sharing'
import { soulseekAccount } from './soulseekAccount'
import { transferLimits } from './transferLimits'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(soulseekAccount)
  .addAction(downloadLocation)
  .addAction(sharing)
  .addAction(transferLimits)
  .addAction(lidarrAutomation)
