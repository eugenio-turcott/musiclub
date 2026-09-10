import React, { Suspense } from 'react';
import { NotFoundPage } from '../views/NotFoundPage';

export const metadata = {
  title: '404: Pista No Encontrada | Musiclub',
  description:
    'La página o disco que estás buscando no existe en el repertorio o ha sido movido a otra frecuencia.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-screen cyber-grid flex items-center justify-center text-white/50">Cargando...</div>}>
      <NotFoundPage />
    </Suspense>
  );
}
