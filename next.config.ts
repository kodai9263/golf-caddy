import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const withPWAConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    runtimeCaching: [
      // 衛星写真マップタイル（電波が弱いコースでもオフライン表示可能にする）
      {
        urlPattern: /^https:\/\/server\.arcgisonline\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'map-tiles',
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
          },
        },
      },
      // 風速APIキャッシュ（オフライン時は直近データで代用）
      {
        urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'weather-api',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 5, // 5分
          },
        },
      },
    ],
  },
})

const nextConfig: NextConfig = {
  turbopack: {}, // Next.js 16 Turbopack との共存設定
}

export default withPWAConfig(nextConfig)
