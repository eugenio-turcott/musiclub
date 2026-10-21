import React from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy({ onClose }) {
  return <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/90 p-4 backdrop-blur-xl"><div role="dialog" aria-modal="true" aria-labelledby="privacy-summary-title" className="mx-auto my-8 max-w-2xl rounded-3xl border border-pink-300/20 bg-[#101222] p-6 sm:p-9">
    <div className="flex items-start justify-between gap-4"><h2 id="privacy-summary-title" className="text-2xl font-bold text-white">Tu privacidad en Musiclub</h2><button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-white/10 px-4 text-sm text-white">Cerrar ✕</button></div>
    <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300"><p>Usamos los datos de tu cuenta para identificarte y guardar tus aportaciones. Tu nombre público, avatar, perfil y reseñas son visibles en el club; tu correo de acceso no forma parte de las reseñas públicas.</p><p>La política completa explica la autenticación, la medición del sitio, el tratamiento de la publicidad y las opciones para gestionar tus datos.</p><p>Para consultas, correcciones o solicitudes de eliminación: <a href="mailto:musiclub.org@gmail.com" className="break-all text-pink-300 underline">musiclub.org@gmail.com</a>.</p><Link to="/privacy" onClick={onClose} className="inline-flex min-h-11 items-center rounded-xl bg-pink-500/15 px-4 font-bold text-pink-200">Leer la política de privacidad completa →</Link></div>
  </div></div>;
}
