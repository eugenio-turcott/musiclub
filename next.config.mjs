import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'mosaic.scdn.co' },
      { protocol: 'https', hostname: 't.scdn.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'coverartarchive.org' },
      { protocol: 'https', hostname: 'archive.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  turbopack: {
    resolveAlias: {
      'react-router-dom': './src/utils/nextRouterAdapter.jsx',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(
        __dirname,
        'src/utils/nextRouterAdapter.jsx'
      ),
    };
    return config;
  },
  env: {
    REACT_APP_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL ||
      process.env.SUPABASE_URL,
    REACT_APP_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.REACT_APP_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY,
    REACT_APP_SPOTIFY_CLIENT_ID:
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
      process.env.REACT_APP_SPOTIFY_CLIENT_ID ||
      process.env.SPOTIFY_CLIENT_ID,
    REACT_APP_SPOTIFY_CLIENT_SECRET:
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ||
      process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ||
      process.env.SPOTIFY_CLIENT_SECRET,
  },
  async rewrites() {
    return [
      // Rewrite release types to standard album detail route
      { source: '/albums/:slug*', destination: '/albumes/:slug*' },
      { source: '/eps/:slug*', destination: '/albumes/:slug*' },
      { source: '/ep/:slug*', destination: '/albumes/:slug*' },
      { source: '/sencillos/:slug*', destination: '/albumes/:slug*' },
      { source: '/singles/:slug*', destination: '/albumes/:slug*' },
      { source: '/single/:slug*', destination: '/albumes/:slug*' },
      { source: '/compilaciones/:slug*', destination: '/albumes/:slug*' },
      { source: '/compilations/:slug*', destination: '/albumes/:slug*' },
      { source: '/remixes/:slug*', destination: '/albumes/:slug*' },
      { source: '/remix/:slug*', destination: '/albumes/:slug*' },
      { source: '/release/:slug*', destination: '/albumes/:slug*' },
      { source: '/lanzamiento/:slug*', destination: '/albumes/:slug*' },

      // Rewrite artist aliases
      { source: '/artistas/:slug*', destination: '/artista/:slug*' },
      { source: '/artist/:slug*', destination: '/artista/:slug*' },
      { source: '/artists/:slug*', destination: '/artista/:slug*' },
    ];
  },
  async redirects() {
    return [
      // Redirect catalog aliases to canonical /catalogo
      { source: '/catalog', destination: '/catalogo', permanent: true },
      { source: '/albums', destination: '/catalogo', permanent: true },
      { source: '/albumes', destination: '/catalogo', permanent: true },

      // Redirect recommendation aliases to /recomendaciones
      { source: '/recommendations', destination: '/recomendaciones', permanent: true },
      { source: '/para-ti', destination: '/recomendaciones', permanent: true },

      // Redirect pool aliases to /pool
      { source: '/pool-musical', destination: '/pool', permanent: true },
      { source: '/temporadas', destination: '/pool', permanent: true },
      { source: '/season', destination: '/pool', permanent: true },

      // Redirect misc aliases
      { source: '/gacha', destination: '/gashapon', permanent: true },
      { source: '/ranking', destination: '/leaderboard', permanent: true },
      { source: '/calificar-portadas', destination: '/portadas', permanent: true },
      { source: '/cover-ratings', destination: '/portadas', permanent: true },
      { source: '/portada/:slug', destination: '/portadas', permanent: true },
      { source: '/playlist', destination: '/playlists', permanent: true },
      { source: '/listas', destination: '/playlists', permanent: true },
      { source: '/perfil', destination: '/profile', permanent: true },
      { source: '/configuracion', destination: '/settings', permanent: true },
      { source: '/ayuda', destination: '/faq', permanent: true },
      { source: '/preguntas-frecuentes', destination: '/faq', permanent: true },
      { source: '/changelog', destination: '/patch-notes', permanent: true },
      { source: '/novedades', destination: '/patch-notes', permanent: true },
      { source: '/privacidad', destination: '/privacy', permanent: true },
      { source: '/terminos', destination: '/terms', permanent: true },
    ];
  },
};

export default nextConfig;
