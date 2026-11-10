import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const apiKey = z.object({
  key: z.string(),
  role: z.enum(['readonly', 'readwrite', 'administrator']),
  cidr: z.string(),
})

const shape = z.looseObject({
  remote_configuration: z.literal(false),
  remote_file_management: z.literal(false),
  flags: z.looseObject({ no_version_check: z.boolean() }),
  directories: z.object({ downloads: z.string(), incomplete: z.string() }),
  shares: z.looseObject({ directories: z.array(z.string()) }),
  web: z.looseObject({
    port: z.number(),
    ip_address: z.string(),
    https: z.looseObject({ disabled: z.literal(true) }),
    authentication: z.looseObject({
      disabled: z.literal(false),
      username: z.string(),
      password: z.string(),
      jwt: z.object({ key: z.string(), ttl: z.number() }),
      api_keys: z.record(z.string(), apiKey),
    }),
  }),
  soulseek: z.looseObject({
    username: z.string(),
    password: z.string(),
    listen_ip_address: z.string(),
    listen_port: z.number(),
  }),
  transfers: z.looseObject({
    upload: z.looseObject({
      slots: z.number(),
      speed_limit: z.number().optional(),
    }),
    download: z.looseObject({
      slots: z.number().optional(),
      speed_limit: z.number().optional(),
    }),
  }),
})

// Written whole on every start; slskd cannot rewrite it while remote configuration is off.
export const slskdYml = FileHelper.yaml(
  { base: sdk.volumes.main, subpath: '/slskd/slskd.yml' },
  shape,
)

export type SlskdYml = z.infer<typeof shape>
