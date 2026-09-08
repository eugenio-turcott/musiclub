// src/pages/LeaderboardPage.jsx
import React from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { SEO } from '../components/SEO';

export function LeaderboardPage() {
  return (
    <>
      <SEO
        title="Ranking y Salón de la Fama de Álbumes | Musiclub"
        description="Descubre el Salón de la Fama con los mejores y peores álbumes calificados por la comunidad de Musiclub. Rankings históricos y estadísticas musicales."
        url="https://www.musiclub.org/leaderboard"
        keywords="mejores albumes, ranking de musica, salon de la fama musica, top albumes, calificaciones musicales, musiclub leaderboard"
      />
      <Leaderboard isPage={true} />
    </>
  );
}
