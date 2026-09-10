import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ibihe AI News — Amakuru n’Ibimenyetso',
    short_name: 'Ibihe',
    description: 'Amakuru yizewe, isoko, ikirere n’ihanura — mu Kinyarwanda.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'rw',
    icons: [
      { src: '/window.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
