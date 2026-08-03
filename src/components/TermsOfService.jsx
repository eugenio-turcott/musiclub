// src/components/TermsOfService.jsx
import React from 'react';

export function TermsOfService({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[99999] overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto mt-8 mb-16">
        <div className="bg-black/80 border border-[#f5576c]/20 rounded-3xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">📋</span>
                Términos de Servicio
              </h1>
              <p className="text-white/30 text-sm mt-1">
                Última actualización: Agosto 2026
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/70 transition-colors text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6 text-white/70 text-sm leading-relaxed">
            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                1. Aceptación de los Términos
              </h2>
              <p>
                Al usar{' '}
                <span className="text-[#f5576c] font-medium">Musiclub</span>{' '}
                ("la aplicación"), aceptas cumplir con estos Términos de
                Servicio. Si no estás de acuerdo, por favor no uses la
                aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                2. Descripción del Servicio
              </h2>
              <p>
                Musiclub es una plataforma comunitaria donde los usuarios
                pueden:
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4 mt-2">
                <li>
                  Sugerir álbumes musicales para el pool de la máquina musical.
                </li>
                <li>Participar en sorteos aleatorios de álbumes.</li>
                <li>Calificar y reseñar álbumes.</li>
                <li>Ver rankings y estadísticas de la comunidad.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                3. Cuentas de Usuario
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>Debes tener al menos 13 años para usar la aplicación.</li>
                <li>
                  Eres responsable de mantener la confidencialidad de tu cuenta.
                </li>
                <li>No debes compartir tu cuenta con otros usuarios.</li>
                <li>
                  Nos reservamos el derecho de suspender cuentas que violen
                  estos términos.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                4. Conducta del Usuario
              </h2>
              <p className="mb-2">Al usar la aplicación, aceptas:</p>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>No publicar contenido ofensivo, difamatorio o ilegal.</li>
                <li>No hacer spam o promocionar productos no autorizados.</li>
                <li>No intentar hackear o dañar la aplicación.</li>
                <li>No suplantar a otros usuarios.</li>
                <li>
                  Respetar las decisiones del administrador sobre los álbumes
                  ganadores.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                5. Propiedad Intelectual
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>
                  Los álbumes sugeridos son propiedad de sus respectivos
                  artistas.
                </li>
                <li>
                  Las reseñas y calificaciones son propiedad de los usuarios que
                  las crean.
                </li>
                <li>
                  El código y diseño de Musiclub son propiedad de los
                  desarrolladores.
                </li>
                <li>
                  No puedes copiar o distribuir el contenido sin autorización.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                6. Sistema de la Máquina Musical
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>
                  El sistema de selección de álbumes es completamente aleatorio.
                </li>
                <li>
                  El administrador puede gestionar el estado de los álbumes
                  (ACTIVO, INACTIVO, GANADOR).
                </li>
                <li>
                  Los álbumes ganadores se muestran públicamente en la
                  aplicación.
                </li>
                <li>
                  Las calificaciones y reviews son públicas y forman parte de la
                  comunidad.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                7. Limitación de Responsabilidad
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>
                  Musiclub se proporciona "tal cual" sin garantías de ningún
                  tipo.
                </li>
                <li>
                  No somos responsables por la disponibilidad de los álbumes en
                  plataformas externas.
                </li>
                <li>
                  Los enlaces a Spotify, YouTube, etc., son proporcionados por
                  los usuarios.
                </li>
                <li>
                  No garantizamos que la aplicación esté libre de errores o
                  interrupciones.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                8. Moderación
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/60 ml-4">
                <li>
                  El administrador tiene el derecho de moderar el contenido.
                </li>
                <li>
                  Los álbumes pueden ser eliminados si no cumplen con los
                  criterios de la comunidad.
                </li>
                <li>Las reseñas inapropiadas pueden ser eliminadas.</li>
                <li>
                  Los usuarios que violen estos términos pueden ser suspendidos.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                9. Cambios a los Términos
              </h2>
              <p>
                Podemos actualizar estos términos ocasionalmente. Te
                notificaremos de cambios significativos a través de la
                aplicación o por correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="text-white/90 text-base font-semibold mb-2">
                10. Contacto
              </h2>
              <p>
                Si tienes preguntas sobre estos términos, contáctanos en:{' '}
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
