import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

type Ini = Record<string, Record<string, string>>

const shape = z.record(z.string(), z.record(z.string(), z.string()))

// Python's configparser keeps quotes and backslashes literally, so values are written unescaped.
function toFile(data: Ini) {
  return Object.entries(data)
    .map(
      ([section, values]) =>
        `[${section}]\n` +
        Object.entries(values)
          .map(([key, value]) => `${key} = ${value}\n`)
          .join(''),
    )
    .join('\n')
}

function fromFile(raw: string) {
  const data: Ini = {}
  let section: Record<string, string> | null = null
  for (const line of raw.split('\n')) {
    const header = line.match(/^\[(.+)\]\s*$/)
    if (header) {
      section = data[header[1]] = {}
      continue
    }
    const pair = line.match(/^([^=#;]+?)\s*=\s*(.*)$/)
    if (section && pair) section[pair[1]] = pair[2]
  }
  return data
}

export const configIni = FileHelper.raw<Ini>(
  { base: sdk.volumes.main, subpath: '/soularr/config.ini' },
  toFile,
  fromFile,
  (data) => shape.parse(data),
)
