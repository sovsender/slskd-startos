import { i18n } from './i18n'
import { sdk } from './sdk'
import { peerHostId, peerPort, uiHostId, uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiOrigin = await sdk.MultiHost.of(effects, uiHostId).bindPort(uiPort, {
    protocol: 'http',
    preferredExternalPort: uiPort,
  })
  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: 'ui',
    description: i18n('The slskd web interface'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  // Soulseek peers connect in on the port slskd reports to the server, so the external port must match.
  const peerOrigin = await sdk.MultiHost.of(effects, peerHostId).bindPort(
    peerPort,
    {
      protocol: null,
      addSsl: null,
      preferredExternalPort: peerPort,
      secure: { ssl: false },
    },
  )
  const peer = sdk.createInterface(effects, {
    name: i18n('Soulseek Peers'),
    id: 'peer',
    description: i18n('Incoming connections from other Soulseek users'),
    type: 'p2p',
    masked: true,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await uiOrigin.export([ui]), await peerOrigin.export([peer])]
})
