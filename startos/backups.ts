import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) =>
    sdk.Backups.ofVolumes('startos', 'main').setOptions({
      exclude: [
        '/lidarr-share',
        '/slskd/incomplete',
        '/slskd/downloads',
        '/slskd/logs',
        '/slskd/data/backups',
      ],
    }),
)
