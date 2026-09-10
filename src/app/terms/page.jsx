import React from 'react';
import { TermsOfService } from '../../views/TermsOfService';

export const metadata = {
  title: 'Términos de Servicio | Musiclub',
  description:
    'Consulta los términos, normas de convivencia comunitaria y condiciones de uso de la plataforma colaborativa de música Musiclub.',
  alternates: {
    canonical: 'https://www.musiclub.org/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsRoutePage() {
  return <TermsOfService />;
}
