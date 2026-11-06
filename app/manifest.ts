import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wash Riders - Sistema de Inventarios',
    short_name: 'Wash Riders',
    description: 'Gestión de productos, existencias y movimientos de inventario.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/wash-riders.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}