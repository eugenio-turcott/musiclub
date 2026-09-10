import React from 'react';
import { LeaderboardPage } from '../../views/LeaderboardPage';

export const metadata = {
  title: 'Ranking y Salón de la Fama de Álbumes | Musiclub',
  description:
    'Descubre el Salón de la Fama con los mejores y peores álbumes calificados por la comunidad de Musiclub. Rankings históricos y estadísticas musicales.',
  alternates: {
    canonical: 'https://www.musiclub.org/leaderboard',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Ranking y Salón de la Fama de Álbumes | Musiclub',
    description:
      'Descubre el Salón de la Fama con los mejores y peores álbumes calificados por la comunidad de Musiclub.',
    url: 'https://www.musiclub.org/leaderboard',
    siteName: 'Musiclub',
    images: [{ url: 'https://www.musiclub.org/musiclub_logo_corchea.png' }],
  },
};

export default function LeaderboardRoutePage() {
  return <LeaderboardPage />;
}
