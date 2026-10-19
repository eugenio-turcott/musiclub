import React from 'react';
import { GashaponPage } from '../../views/GashaponPage';
import { getPublicCatalog } from '../../server/catalog';

export const revalidate = 300;

export const metadata = {
  title: 'Gashapon Musical — Descubre Música',
  description:
    'Elige un género musical y descubre lanzamientos reales del club. Cada género tiene su cápsula y el sorteo respeta el género seleccionado.',
  alternates: {
    canonical: 'https://www.musiclub.org/gashapon',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function GashaponRoutePage() {
  const { albums } = await getPublicCatalog();
  return <GashaponPage initialAlbums={albums} />;
}
