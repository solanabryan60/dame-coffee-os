import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dame Coffee',
    short_name: 'Dame',
    description: 'Find Dame today, order pickup, and keep your rewards close.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#d9d9d9',
    theme_color: '#961010',
    orientation: 'portrait-primary',
    categories: ['food', 'lifestyle', 'shopping'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/app-icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Order pickup',
        short_name: 'Order',
        description: 'Start a Dame pickup order',
        url: '/order',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'My rewards',
        short_name: 'Rewards',
        description: 'See your Dame points and rewards',
        url: '/rewards/account',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
