import { healthFns } from '@start9labs/start-sdk'
import { i18n } from './i18n'
import { peerPort, uiPort } from './utils'

type Result = healthFns.HealthCheckResult

type ServerState = {
  isConnected?: boolean
  isConnecting?: boolean
  isLoggedIn?: boolean
  isLoggingIn?: boolean
}

type AppState = {
  server?: ServerState
  connectionWatchdog?: { isEnabled?: boolean }
}

export async function soulseekStatus(
  apiKey: string,
  username: string,
  assignedPeerPort: number | null,
): Promise<Result> {
  let server: ServerState
  let autoReconnect: boolean
  try {
    const res = await fetch(`http://127.0.0.1:${uiPort}/api/v0/application`, {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(String(res.status))
    const state = (await res.json()) as AppState
    server = state.server ?? {}
    // slskd stops its reconnect watchdog after a manual disconnect, a refused login, or a kick.
    autoReconnect = state.connectionWatchdog?.isEnabled ?? true
  } catch {
    return { result: 'starting', message: i18n('Waiting for slskd') }
  }

  if (server.isLoggedIn) {
    if (assignedPeerPort !== null && assignedPeerPort !== peerPort) {
      return {
        result: 'success',
        message: i18n(
          'Logged in as ${username}. The Soulseek Peers port is ${port} instead of ${expected}, so other users cannot connect to you; free port ${expected} on this server.',
          { username, port: assignedPeerPort, expected: peerPort },
        ),
      }
    }
    return {
      result: 'success',
      message: i18n('Logged in as ${username}', { username }),
    }
  }
  if (server.isConnecting || server.isLoggingIn) {
    return {
      result: 'starting',
      message: i18n('Connecting to the Soulseek network'),
    }
  }
  if (server.isConnected) {
    return {
      result: 'failure',
      message: i18n(
        'Connected, but the login was refused. The username may belong to someone else, or the password is wrong; change them in Soulseek Account.',
      ),
    }
  }
  if (!autoReconnect) {
    return {
      result: 'failure',
      message: i18n(
        'Not connected, and slskd has stopped retrying. Someone disconnected in the slskd web interface, the login was refused, or this Soulseek account logged in from another client. Check the logs, then connect again from the web interface or restart slskd.',
      ),
    }
  }
  return {
    result: 'failure',
    message: i18n(
      'Not connected to the Soulseek network. slskd keeps retrying; check that this server can reach the internet.',
    ),
  }
}

export async function lidarrStatus(
  address: string,
  apiKey: string,
  downloadDir: string,
  fileManager: string,
  minutes: number,
): Promise<Result> {
  const get = (path: string) =>
    fetch(`http://${address}/api/v1${path}`, {
      headers: { 'X-Api-Key': apiKey },
      signal: AbortSignal.timeout(10_000),
    })

  try {
    const status = await get('/system/status')
    if (!status.ok) {
      return {
        result: 'failure',
        message: i18n('Lidarr refused the connection (HTTP ${code})', {
          code: status.status,
        }),
      }
    }
    const parent = downloadDir.slice(0, downloadDir.lastIndexOf('/') + 1)
    const listing = (await (
      await get(
        `/filesystem?path=${encodeURIComponent(parent)}&includeFiles=false`,
      )
    ).json()) as { directories?: { path?: string }[] }
    const visible = listing.directories?.some(
      (d) => d.path?.replace(/\/+$/, '') === downloadDir,
    )
    if (!visible) {
      return {
        result: 'failure',
        message: i18n(
          'Lidarr cannot see ${folder}, so it cannot import downloads. In Lidarr, run Media Storage and select ${fileManager}.',
          { folder: downloadDir, fileManager },
        ),
      }
    }
  } catch {
    return { result: 'failure', message: i18n('Cannot reach Lidarr') }
  }

  return {
    result: 'success',
    message: i18n(
      'Connected to Lidarr. Soularr checks for missing albums every ${minutes} minutes.',
      { minutes },
    ),
  }
}
