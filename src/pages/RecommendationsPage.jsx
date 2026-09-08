// src/pages/RecommendationsPage.jsx
import React from 'react';
import { Recommendations } from '../components/Recommendations';
import { SEO } from '../components/SEO';

export function RecommendationsPage() {
  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <SEO
        title="Recomendaciones Musicales Inteligentes | Musiclub"
        description="Descubre álbumes y artistas afines a tus gustos musicales con el motor de recomendaciones personalizadas de Musiclub."
        url="https://www.musiclub.org/recomendaciones"
        keywords="recomendaciones de musica, descubrir musica, nuevos albumes, que musica escuchar, musiclub recomendaciones"
      />
      <Recommendations isPage={true} />
    </div>
  );
}

export default RecommendationsPage;
