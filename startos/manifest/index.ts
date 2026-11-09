import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'slskd',
  title: 'slskd',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/sovsender/slskd-startos',
  upstreamRepo: 'https://github.com/slskd/slskd',
  marketingUrl: 'https://slskd.org',
  donationUrl: null,
  description: { short, long },
  volumes: ['startos', 'main'],
  images: {
    slskd: {
      source: { dockerTag: 'slskd/slskd:0.26.2' },
      arch: ['x86_64', 'aarch64'],
    },
    soularr: {
      source: { dockerBuild: { dockerfile: './soularr.Dockerfile' } },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
