// src/pages/FAQPage.jsx
import React from 'react';
import { FAQ } from '../components/FAQ';
import { SEO } from '../components/SEO';

export function FAQPage() {
  return (
    <>
      <SEO
        title="Preguntas Frecuentes & Guía del Club | Musiclub"
        description="Resuelve todas tus dudas sobre Musiclub: cómo funciona la Ruleta Cyberpunk, el sistema de calificaciones de 6 criterios, el Leaderboard y la dinámica del club."
        url="https://musiclub.org/faq"
      />
      <FAQ isPage={true} />
    </>
  );
}
