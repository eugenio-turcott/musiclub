// src/pages/TermsOfService.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';

export function TermsOfService() {
  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <SEO
        title="Términos de Servicio | Musiclub"
        description="Consulta los términos, normas de convivencia comunitaria y condiciones de uso de la plataforma colaborativa de música Musiclub."
        url="https://musiclub.org/terms"
      />

      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Universal App Header */}
        <AppHeader showTitle={false} />

        {/* Hero Header estilo Patch Notes */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#121426] via-[#1a1738] to-[#0c0d1e] border border-white/10 shadow-2xl">
          {/* Orbes decorativos */}
          <div className="absolute -top-12 -right-12 w-60 h-60 bg-[#f5576c]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-[#f093fb]/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-[#f5576c] text-xs font-extrabold uppercase tracking-widest shadow-sm">
                <span>📋</span>
                <span>Normas & Convivencia Comunitaria</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f093fb] to-[#f5576c] tracking-tight">
                Términos de Servicio
              </h1>
              <p className="text-white/70 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
                Descubre las normas de respeto, dinámica de votaciones y condiciones de participación colectiva en la comunidad de escucha musical de Musiclub.
              </p>
            </div>

            {/* Badges estilo Patch Notes */}
            <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md flex items-center gap-2 shadow-xl">
                  <span className="text-xs">🤝</span>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                      Comunidad
                    </p>
                    <p className="text-white font-black text-xs sm:text-sm leading-tight">
                      Sin Fines de Lucro
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md flex items-center gap-3 shadow-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                      Vigencia
                    </p>
                    <p className="text-white font-black text-base sm:text-lg leading-tight">
                      Año 2026
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/85 border border-[#f5576c]/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">

          <div className="space-y-6 text-white/80 text-xs sm:text-sm leading-relaxed">
            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">1.</span> Aceptación y Naturaleza del Club
              </h2>
              <p>
                Bienvenido a <strong className="text-[#f5576c]">Musiclub</strong>. Al acceder o utilizar nuestra plataforma web, aceptas regirte por los presentes Términos de Servicio. Musiclub es un proyecto recreativo y colaborativo sin fines de lucro, diseñado para fomentar la apreciación artística, la escucha colectiva de álbumes y el debate musical constructivo.
              </p>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">2.</span> Funcionalidades de la Plataforma
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-white/70 ml-2">
                <li><strong className="text-white">Ruleta Cyberpunk (Slot Machine):</strong> Mecanismo aleatorio con probabilidad ponderada por antigüedad para elegir el álbum semanal del club.</li>
                <li><strong className="text-white">Catálogo y Escuchas Individuales:</strong> Exploración y propuesta de álbumes desde Spotify, tanto para la ruleta comunitaria como para escuchas libres.</li>
                <li><strong className="text-white">Sistema de Reseñas:</strong> Calificación analítica en 6 criterios técnicos, evaluación canción por canción (tracklist) y publicación de opiniones.</li>
                <li><strong className="text-white">Leaderboard e Insignias:</strong> Reconocimiento a los críticos más constantes y activos de la comunidad.</li>
                <li><strong className="text-white">Perfiles de Usuario:</strong> Panel de personalización y estadísticas críticas individuales.</li>
              </ul>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">3.</span> Reglas de Conducta y Respeto
              </h2>
              <p className="mb-2">Para garantizar un ambiente sano de enriquecimiento musical, todos los usuarios se comprometen a:</p>
              <ul className="list-disc list-inside space-y-1 text-white/70 ml-2">
                <li>Expresar opiniones críticas con respeto mutuo, sin caer en ataques personales, acoso o discriminación.</li>
                <li>No publicar contenido ofensivo, ilegal, difamatorio o spam comercial en las reseñas y biografías.</li>
                <li>Emitir calificaciones genuinas basadas en la escucha real de los álbumes propuestos.</li>
                <li>No crear cuentas falsas o utilizar scripts automatizados para alterar los puntajes de las canciones o el Leaderboard.</li>
              </ul>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">4.</span> Propiedad Intelectual y Enlaces a Terceros
              </h2>
              <p className="mb-2">
                • <strong>Música, Nombres y Carátulas:</strong> Todos los derechos sobre las canciones, nombres artísticos, grabaciones y portadas pertenecen exclusivamente a sus respectivos autores, intérpretes y sellos discográficos. Musiclub no almacena archivos de audio ni comercializa música.
              </p>
              <p className="text-white/70">
                • <strong>Contenido de los Usuarios:</strong> Conservas la autoría de tus reseñas, análisis y comentarios, otorgando a Musiclub una licencia no exclusiva para mostrarlos dentro del catálogo y rankings de la plataforma.
              </p>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">5.</span> Moderación y Administración
              </h2>
              <p>
                El equipo de administración se reserva el derecho de supervisar el correcto uso de la plataforma, cambiar el estado de los álbumes (Activo, Inactivo, Individual), editar propuestas duplicadas o eliminar reseñas y cuentas que violen reiteradamente las reglas de convivencia.
              </p>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">6.</span> Disponibilidad y Limitación de Responsabilidad
              </h2>
              <p>
                Musiclub se proporciona "tal cual" y "según disponibilidad". Aunque procuramos ofrecer una experiencia continua y sin interrupciones, no nos responsabilizamos por fallos técnicos de proveedores externos (Spotify API, Supabase) o indisponibilidad temporal de ciertos álbumes en plataformas de streaming.
              </p>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">7.</span> Consultas y Soporte
              </h2>
              <p>
                Para cualquier consulta sobre la logística del club, el sistema de puntuaciones o estos términos, consulta la sección de{' '}
                <Link to="/faq" className="text-[#f5576c] hover:underline font-semibold">
                  Preguntas Frecuentes (FAQ)
                </Link>{' '}
                o contacta a la administración.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <span>© 2026 Musiclub. Todos los derechos reservados.</span>
            <div className="flex gap-4">
              <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Política de Privacidad</Link>
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <Footer />
      </div>
    </div>
  );
}
