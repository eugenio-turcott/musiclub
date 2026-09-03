// src/pages/PrivacyPolicy.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Universal App Header */}
        <AppHeader showTitle={false} />

        <div className="bg-black/85 border border-[#f5576c]/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-white/10 pb-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5576c]/15 border border-[#f5576c]/30 text-[#f5576c] text-xs font-bold uppercase tracking-wider mb-2">
                <span>🔒</span> Transparencia y Protección
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white title-albumes">
                POLÍTICA DE PRIVACIDAD
              </h1>
              <p className="text-white/40 text-xs sm:text-sm mt-1">
                Última actualización: Versión 4.2 · Agosto 2026
              </p>
            </div>
            <div className="text-4xl hidden sm:block">🎧</div>
          </div>

          <div className="space-y-6 text-white/80 text-xs sm:text-sm leading-relaxed">
            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">1.</span> Introducción y Compromiso
              </h2>
              <p>
                En <strong className="text-[#f5576c]">Musiclub</strong> ("nosotros", "la plataforma" o "el club"), valoramos la confianza de nuestra comunidad de escucha musical. Esta Política de Privacidad describe de manera transparente qué datos recopilamos, cómo los utilizamos dentro de las funciones de la aplicación (como el sistema de reseñas, la ruleta y el leaderboard) y cómo protegemos tu información personal.
              </p>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">2.</span> Información que Recopilamos
              </h2>
              <ul className="list-disc list-inside space-y-2 text-white/70 ml-2">
                <li>
                  <strong className="text-white">Datos de Cuenta y Autenticación:</strong> Al iniciar sesión con Google OAuth o enlace de correo seguro (gestionado vía Supabase Auth), recopilamos tu nombre público, dirección de correo electrónico y foto de perfil/avatar.
                </li>
                <li>
                  <strong className="text-white">Datos de Perfil Musical:</strong> Información voluntaria que añades a tu perfil, como biografía, artista favorito, álbum predilecto, géneros preferidos y enlaces públicos a tus cuentas de Spotify o Instagram.
                </li>
                <li>
                  <strong className="text-white">Aportaciones de Álbumes:</strong> Álbumes propuestos mediante la integración con la API de Spotify (título, artista, año, pistas y portada).
                </li>
                <li>
                  <strong className="text-white">Reseñas y Calificaciones:</strong> Puntuaciones pista por pista, evaluaciones de los 6 criterios técnicos, calificación general y textos de análisis o comentarios que publicas en la comunidad.
                </li>
                <li>
                  <strong className="text-white">Datos de Interacción:</strong> Registro de participación en la ruleta, desbloqueo automático de insignias y estadísticas de actividad en el Leaderboard.
                </li>
              </ul>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">3.</span> Finalidad del Uso de los Datos
              </h2>
              <p className="mb-2">Toda la información recopilada se utiliza exclusivamente para la logística y entretenimiento de la comunidad:</p>
              <ul className="list-disc list-inside space-y-1.5 text-white/70 ml-2">
                <li>Gestionar tu sesión e identificar tus aportaciones y críticas en el club.</li>
                <li>Calcular los promedios ponderados de los álbumes y los rankings de la comunidad.</li>
                <li>Alimentar el podio y las insignias de reconocimiento en el Leaderboard.</li>
                <li>Personalizar tu panel de estadísticas críticas en "Mi Perfil".</li>
                <li>Asegurar el correcto funcionamiento técnico de la Ruleta y del catálogo.</li>
              </ul>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">4.</span> Almacenamiento, Seguridad e Integraciones
              </h2>
              <p className="mb-2">
                Tus datos se almacenan de manera segura en la nube mediante <strong className="text-white">Supabase</strong>, aprovechando bases de datos PostgreSQL con políticas de seguridad de acceso a nivel de fila (Row Level Security - RLS) y protocolos de cifrado SSL/TLS.
              </p>
              <p className="text-white/70">
                • <strong>Spotify Web API:</strong> Solo consultamos metadata pública de álbumes y pistas; no tenemos acceso a tus credenciales privadas ni datos bancarios de Spotify.<br />
                • <strong>Terceros:</strong> <span className="text-[#f5576c] font-semibold">Nunca vendemos, alquilamos ni comercializamos tu información personal con empresas de publicidad de terceros.</span>
              </p>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">5.</span> Naturaleza Pública de las Reseñas
              </h2>
              <p>
                Musiclub es una plataforma social para compartir apreciación musical. Por tanto, tu nombre público, avatar, biografía, calificaciones de canciones, reseñas de texto y álbumes propuestos son visibles para los demás miembros de la comunidad y visitantes del club.
              </p>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">6.</span> Tus Derechos sobre tus Datos
              </h2>
              <p className="mb-2">Tienes control absoluto sobre tus aportaciones y datos:</p>
              <ul className="list-disc list-inside space-y-1 text-white/70 ml-2">
                <li><strong>Editar tu Perfil:</strong> Modifica tu avatar, biografía y preferencias en cualquier momento desde <Link to="/settings" className="text-[#f5576c] hover:underline font-semibold">Configuración</Link>.</li>
                <li><strong>Modificar Reseñas:</strong> Puedes actualizar tus puntuaciones y comentarios de cualquier disco volviendo a abrir su formulario de reseña.</li>
                <li><strong>Eliminación de Cuenta y Datos:</strong> Puedes solicitar la eliminación definitiva de tu usuario y registros asociados contactando al administrador.</li>
              </ul>
            </section>

            <section className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <span className="text-[#f5576c]">7.</span> Contacto y Dudas
              </h2>
              <p>
                Si tienes alguna pregunta o inquietud sobre el manejo de tus datos, puedes consultar nuestra sección de{' '}
                <Link to="/faq" className="text-[#f5576c] hover:underline font-semibold">
                  Preguntas Frecuentes (FAQ)
                </Link>{' '}
                o comunicarte directamente con el administrador del club.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <span>© 2026 Musiclub. Todos los derechos reservados.</span>
            <div className="flex gap-4">
              <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Términos de Servicio</Link>
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <Footer />
      </div>
    </div>
  );
}
