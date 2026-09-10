import React from 'react';
import { GashaponPage } from '../../views/GashaponPage';

export const metadata = {
  title: 'Gashapon Musical — Ruleta Arcade para Descubrir Álbumes | Musiclub',
  description:
    'Juega en la máquina Gashapon de Musiclub. Gira la ruleta arcade para obtener álbumes aleatorios, descubrir joyas ocultas y sumar lanzamientos a tu lista de escucha.',
  alternates: {
    canonical: 'https://www.musiclub.org/gashapon',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GashaponRoutePage() {
  return <GashaponPage />;
}
