import {MusiclubTour} from '../../components/MusiclubTour';
import {getTourExamples} from '../../server/tourExamples';
export const revalidate=300;
export const metadata = { title: 'Guía interactiva de Musiclub', description: 'Explora Musiclub con ejemplos interactivos: catálogo, reseñas, Pools, Máquina Musical, Gashapon, perfiles, niveles y tarjetas para compartir.', alternates: { canonical: 'https://www.musiclub.org/guias' } };
export default async function GuidesPage() {
  const examples=await getTourExamples().catch(()=>null);
  return <MusiclubTour examples={examples}/>;
}
