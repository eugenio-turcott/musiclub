import '../styles/global.css';
import '../index.css';
import { Figtree } from 'next/font/google';
import Script from 'next/script';
import { ClientProviders } from './ClientProviders';

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
});

export const viewport = {
  themeColor: '#0c0d1e',
};

export const metadata = {
  metadataBase: new URL('https://www.musiclub.org'),
  title: {
    default: 'Musiclub - Reviews From & For Music Lovers',
    template: '%s | Musiclub',
  },
  description:
    'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales, recomendaciones personalizadas, análisis detallados pista por pista y el pool musical semanal.',
  keywords: [
    'musica',
    'albumes',
    'reviews',
    'calificaciones',
    'club de musica',
    'reseñas musicales',
    'spotify',
    'musicbrainz',
    'canciones',
    'rankings',
    'discografia',
  ],
  verification: {
    google: '0pLiSU5HTFvlbKZcVEg8qnt2O6lQsCFt-t5IFgTlwK8',
  },
  icons: {
    icon: '/musiclub_logo_corchea.png',
    apple: '/musiclub_logo_corchea.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.musiclub.org',
    siteName: 'Musiclub',
    title: 'Musiclub - Reviews From & For Music Lovers',
    description:
      'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales, recomendaciones personalizadas y el pool musical semanal.',
    images: [
      {
        url: 'https://www.musiclub.org/musiclub_logo_corchea.png',
        width: 1200,
        height: 630,
        alt: 'Musiclub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Musiclub - Reviews From & For Music Lovers',
    description:
      'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales y recomendaciones personalizadas.',
    images: ['https://www.musiclub.org/musiclub_logo_corchea.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={figtree.variable}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3995824345173266"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-[#0a0a12] text-white antialiased min-h-screen">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
