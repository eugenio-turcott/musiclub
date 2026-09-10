import React from 'react';
import { FAQPage } from '../../views/FAQPage';

export const metadata = {
  title: 'Preguntas Frecuentes & Guía del Club | Musiclub',
  description:
    'Resuelve todas tus dudas sobre Musiclub: cómo funciona la Ruleta, el sistema de calificaciones, el Leaderboard y la dinámica de reseñas en comunidad.',
  alternates: {
    canonical: 'https://www.musiclub.org/faq',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Preguntas Frecuentes & Guía del Club | Musiclub',
    description:
      'Resuelve todas tus dudas sobre Musiclub: cómo funciona la Ruleta, el sistema de calificaciones, el Leaderboard y la dinámica de reseñas en comunidad.',
    url: 'https://www.musiclub.org/faq',
    siteName: 'Musiclub',
    images: [{ url: 'https://www.musiclub.org/musiclub_logo_corchea.png' }],
  },
};

export default function FAQRoutePage() {
  return <FAQPage />;
}
