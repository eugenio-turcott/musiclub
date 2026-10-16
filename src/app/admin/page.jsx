import React from 'react';
import { AdminPage } from '../../views/AdminPage';

export const metadata = {
  title: 'Panel de Administración',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRoutePage() {
  return <AdminPage />;
}
