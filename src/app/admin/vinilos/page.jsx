import { AdminPage } from '../../../views/AdminPage';

export const metadata = {
  title: 'Vinilos de géneros · Administración',
  robots: {index:false,follow:false},
};

export default function AdminVinylPage() {
  return <AdminPage initialTab="vinyls"/>;
}
