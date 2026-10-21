import Link from 'next/link';
import { InformationPage } from '../../components/InformationPage';

export const metadata = { title:'Contacto y correcciones', description:'Contacta con Musiclub para soporte, correcciones del catálogo, privacidad o incidencias en las reseñas.', alternates:{canonical:'https://www.musiclub.org/contacto'} };
export default function ContactMusiclub() {
  return <InformationPage title="Hablemos de Musiclub" intro="Este es el contacto público de la administración del club. Puedes escribirnos sobre el sitio, tu cuenta o los contenidos que aparecen en la comunidad.">
    <a href="mailto:musiclub.org@gmail.com" className="inline-block max-w-full break-all rounded-xl border border-pink-300/30 bg-pink-500/10 px-4 py-3 text-base font-bold text-pink-200 underline">musiclub.org@gmail.com</a>
    <section><h2 className="text-xl font-bold text-white">Soporte y datos del catálogo</h2><p className="mt-3">Incluye el enlace de la página, qué ocurrió y qué esperabas ver. Si se trata de un release, añade el título y artista y, si lo tienes, un enlace a su ficha oficial en una plataforma musical. Esto ayuda a distinguir ediciones y artistas con nombres similares.</p></section>
    <section><h2 className="text-xl font-bold text-white">Privacidad y cuenta</h2><p className="mt-3">Puedes solicitar acceso, corrección o eliminación de tus datos. Indica tu nombre público y la cuenta relacionada; podremos pedir una comprobación de titularidad antes de actuar. Nunca necesitamos tu contraseña ni un código de acceso para atenderte.</p><Link href="/privacy" className="mt-3 inline-block text-pink-300 underline">Consultar la política de privacidad →</Link></section>
    <section><h2 className="text-xl font-bold text-white">Contenido y derechos</h2><p className="mt-3">Para reportar una reseña, una imagen o un problema de atribución, envía el enlace exacto y explica qué necesitas corregir. Si actúas como titular de derechos, identifica la obra y tu relación con ella para que la administración pueda revisar el caso.</p></section>
    <p className="border-t border-white/10 pt-4 text-xs text-slate-400">Tu mensaje se usa para atender la solicitud. Evita adjuntar información personal que no sea necesaria para explicar el problema.</p>
  </InformationPage>;
}
