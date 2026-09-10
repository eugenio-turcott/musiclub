import React from 'react';
import { CoverRatingsPage } from '../../views/CoverRatingsPage';

export const metadata = {
  title: 'Calificación de Portadas de Álbumes | Musiclub',
  description:
    'Califica las portadas de tus álbumes favoritos, explora el ranking visual y vota por el mejor diseño de portada musical en Musiclub.',
  alternates: {
    canonical: 'https://www.musiclub.org/portadas',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PortadasRoutePage() {
  return <CoverRatingsPage />;
}
