import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

const secret = () => utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 48 })

export const seedSecrets = sdk.setupOnInit(async (effects) => {
  const store = await storeJson.read().once()
  await storeJson.merge(effects, {
    jwtKey: store?.jwtKey ?? secret(),
    startosApiKey: store?.startosApiKey ?? secret(),
    soularrApiKey: store?.soularrApiKey ?? secret(),
  })
})
