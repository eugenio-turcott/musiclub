// src/pages/FAQPage.jsx
import React from 'react';
import { FAQ } from '../components/FAQ';
import { SEO } from '../components/SEO';

export function FAQPage() {
  return (
    <>
      <SEO
        title="Preguntas Frecuentes & Guía del Club | Musiclub"
        description="Resuelve todas tus dudas sobre Musiclub: cómo funciona la Ruleta, el sistema de calificaciones, el Leaderboard y la dinámica de reseñas en comunidad."
        url="https://www.musiclub.org/faq"
        keywords="faq musiclub, preguntas frecuentes, como funciona musiclub, reglas del club de musica"
      />
      <FAQ isPage={true} />
    </>
  );
}
