// src/pages/PrivacyPolicy.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen cyber-grid p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Botón para volver */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-6 text-sm"
        >
          ← Volver a la Máquina Musical
        </Link>

        <div className="bg-black/80 border border-[#f5576c]/20 rounded-3xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🔒</span>
                Política de Privacidad
              </h1>
              <p className="text-white/30 text-sm mt-1">
                Última actualización: Agosto 2026
              </p>
            </div>
            <div className="text-3xl">🎵</div>
          </div>

          <div className="space-y-6 text-white/70 text-sm leading-relaxed">
            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                1. Introducción
              </h2>
              <p>
                En <span className="text-[#f5576c] font-medium">Musiclub</span>{' '}
                ("nosotros", "nuestro" o "la aplicación"), valoramos tu
                privacidad y nos comprometemos a proteger tus datos personales.
                Esta política de privacidad explica cómo recopilamos, usamos y
                protegemos tu información cuando utilizas nuestra aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                2. Información que Recopilamos
              </h2>
              <p className="mb-2">Recopilamos la siguiente información:</p>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>
                  <strong>Información de autenticación:</strong> Nombre, correo
                  electrónico y foto de perfil (a través de Google).
                </li>
                <li>
                  <strong>Preferencias musicales:</strong> Álbumes que sugieres
                  y tus calificaciones/reviews.
                </li>
                <li>
                  <strong>Datos de uso:</strong> Interacciones con la máquina
                  musical y participación en sorteos.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                3. Cómo Usamos tu Información
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>Para autenticarte y gestionar tu cuenta.</li>
                <li>Para mostrar tus sugerencias de álbumes.</li>
                <li>Para generar rankings y estadísticas de la comunidad.</li>
                <li>Para mejorar la experiencia de la máquina musical.</li>
                <li>Para comunicarnos contigo sobre actualizaciones.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                4. Almacenamiento de Datos
              </h2>
              <p>
                Tus datos se almacenan de forma segura en{' '}
                <strong>Supabase</strong>, una plataforma de base de datos en la
                nube con altos estándares de seguridad. No compartimos tus datos
                con terceros sin tu consentimiento explícito.
              </p>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                5. Tus Derechos
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>
                  <strong>Acceso:</strong> Puedes ver tus datos en cualquier
                  momento.
                </li>
                <li>
                  <strong>Corrección:</strong> Puedes solicitar correcciones a
                  tus datos.
                </li>
                <li>
                  <strong>Eliminación:</strong> Puedes solicitar la eliminación
                  de tu cuenta.
                </li>
                <li>
                  <strong>Retiro de consentimiento:</strong> Puedes retirar tu
                  consentimiento en cualquier momento.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                6. Cookies y Tecnologías Similares
              </h2>
              <p>
                Usamos cookies para mantener tu sesión activa y recordar tus
                preferencias. No usamos cookies de seguimiento de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                7. Seguridad
              </h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para
                proteger tus datos contra acceso no autorizado, pérdida o
                destrucción.
              </p>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                8. Cambios a esta Política
              </h2>
              <p>
                Podemos actualizar esta política ocasionalmente. Te
                notificaremos de cambios significativos a través de la
                aplicación o por correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                9. Contacto
              </h2>
              <p>
                Si tienes preguntas sobre esta política, contáctanos en:{' '}
                <a
                  href="mailto:musiclub@maquinamusical.com"
                  className="text-[#f5576c] hover:underline"
                >
                  musiclub@maquinamusical.com
                </a>
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-white/20 text-xs text-center">
              © 2026 Musiclub. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
