import { i18n } from './i18n'

export const uiPort = 5030
export const uiHostId = 'ui-multi'
export const peerPort = 50300
export const peerHostId = 'peer'
export const adminUsername = 'admin'

export const appDir = '/app'
export const soularrDataDir = '/data'

// Lidarr's published host id and internal port.
export const lidarrHostId = 'ui-multi'
export const lidarrPort = 8686

export const localhostOnly = '127.0.0.1/32,::1/128'
// The StartOS container bridge: requests from other services on this server arrive from it.
export const bridgeOnly = '10.0.3.0/24,fd00:3::/64'

export const fileManagers = {
  filebrowser: { mountpoint: '/mnt/filebrowser', defaultFolder: 'slskd' },
  nextexplorer: {
    mountpoint: '/mnt/nextexplorer',
    defaultFolder: 'Files/slskd',
  },
} as const

export type FileManager = keyof typeof fileManagers

export const fileManagerTitles: Record<FileManager, string> = {
  filebrowser: 'FileBrowser Quantum',
  nextexplorer: 'NextExplorer',
}

// Soularr's config parser expands `$`, so it is refused here.
export const folderPattern = {
  regex: '(?!/)(?!(?:.*/)?\\.\\.(?:/.*)?$)[^$\\\\\\n]+',
  description: i18n(
    'Cannot start with a slash, contain a .. folder, or use $ or \\',
  ),
}

export function cleanFolder(folder: string) {
  return folder.replace(/^\/+|\/+$/g, '')
}

export function overlaps(a: string, b: string) {
  const x = `${cleanFolder(a)}/`
  const y = `${cleanFolder(b)}/`
  return x.startsWith(y) || y.startsWith(x)
}
