import React from 'react';
import { PrivacyPolicy } from '../../views/PrivacyPolicy';

export const metadata = {
  title: 'Política de Privacidad | Musiclub',
  description:
    'Conoce cómo protegemos tus datos, el tratamiento de tu cuenta con Google OAuth y nuestra política de transparencia y privacidad en Musiclub.',
  alternates: {
    canonical: 'https://www.musiclub.org/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyRoutePage() {
  return <PrivacyPolicy />;
}
