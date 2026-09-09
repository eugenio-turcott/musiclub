// src/components/AdsterraNativeBanner.jsx
import React, { useEffect, useRef } from 'react';

/**
 * Componente que renderiza el Native Banner de Adsterra de forma adaptada a React SPA.
 * Blindado contra temas claro/oscuro del sistema operativo: fuerza texto blanco/claro ultra contrastado.
 * Admite la prop `onlyImages={true}` en caso de desear ocultar el texto y mostrar únicamente las imágenes.
 */
export function AdsterraNativeBanner({ className = '', onlyImages = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Si ya existe el script cargado en este ciclo, evitar duplicados
    const containerId = 'container-0b1f8e88620f4f682b83e40675c39376';
    const existingContainer = document.getElementById(containerId);
    
    if (!existingContainer) return;

    // MutationObserver para forzar estilo claro en cualquier nodo que Adsterra inyecte
    const applyCleanStyles = () => {
      if (!existingContainer) return;
      const elements = existingContainer.querySelectorAll('*');
      elements.forEach((el) => {
        const isTitle = el.className && typeof el.className === 'string' && el.className.includes('__title');
        if (onlyImages && isTitle) {
          el.style.setProperty('display', 'none', 'important');
        } else if (isTitle) {
          el.style.setProperty('color', '#f8fafc', 'important');
          el.style.setProperty('font-weight', '600', 'important');
          el.style.setProperty('text-shadow', '0 1px 3px rgba(0,0,0,0.85)', 'important');
        } else if (el.tagName === 'A' || el.tagName === 'FONT' || el.tagName === 'SPAN' || el.tagName === 'P') {
          el.style.setProperty('color', '#f1f5f9', 'important');
        }
      });
    };

    const observer = new MutationObserver(() => {
      applyCleanStyles();
    });

    observer.observe(existingContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // Inyectar el script de Adsterra de forma asíncrona
    const script = document.createElement('script');
    script.src = 'https://pl31167703.profitableratecpmnetwork.com/0b1f8e88620f4f682b83e40675c39376/invoke.js';
    script.async = true;
    script.dataset.cfasync = 'false';

    try {
      existingContainer.parentNode.insertBefore(script, existingContainer);
    } catch (e) {
      // Manejo silencioso en caso de navegación rápida
    }

    return () => {
      observer.disconnect();
      try {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      } catch (e) {}
    };
  }, [onlyImages]);

  return (
    <div className={`w-full max-w-4xl mx-auto my-6 px-3 sm:px-4 ${onlyImages ? 'adsterra-only-images' : ''} ${className}`}>
      {/* Reglas de estilo incrustadas de alta prioridad para forzar color claro */}
      <style>{`
        #container-0b1f8e88620f4f682b83e40675c39376 {
          color-scheme: dark !important;
        }
        #container-0b1f8e88620f4f682b83e40675c39376,
        #container-0b1f8e88620f4f682b83e40675c39376 *,
        #container-0b1f8e88620f4f682b83e40675c39376 a,
        #container-0b1f8e88620f4f682b83e40675c39376 div,
        #container-0b1f8e88620f4f682b83e40675c39376 span,
        #container-0b1f8e88620f4f682b83e40675c39376 p,
        #container-0b1f8e88620f4f682b83e40675c39376 font {
          color: #f1f5f9 !important;
          text-decoration: none !important;
        }
        #container-0b1f8e88620f4f682b83e40675c39376 [class*="__title"] {
          color: #f8fafc !important;
          font-weight: 600 !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85) !important;
        }
        #container-0b1f8e88620f4f682b83e40675c39376 a:hover [class*="__title"] {
          color: #f472b6 !important;
        }
        ${
          onlyImages
            ? `
          #container-0b1f8e88620f4f682b83e40675c39376 [class*="__title"],
          #container-0b1f8e88620f4f682b83e40675c39376 [class*="__text"] {
            display: none !important;
          }
        `
            : ''
        }
      `}</style>

      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0c18]/80 backdrop-blur-xl p-3 sm:p-4 text-center shadow-lg">
        {/* Cabecera del anuncio con Smartlink discreto */}
        <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-wider text-white/30 border-b border-white/5 pb-1.5 px-1">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500/70 animate-pulse"></span>
            Contenido Patrocinado
          </span>
          <a
            href="https://www.profitableratecpmnetwork.com/t6th9d40w?key=4e5727d8ec1bfa194c514b1411284db6"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-pink-400/70 hover:text-pink-300 transition-colors flex items-center gap-1 lowercase font-normal"
            title="Explorar ofertas y partners de la comunidad"
          >
            más ofertas ↗
          </a>
        </div>

        {/* Contenedor oficial requerido por Adsterra */}
        <div
          ref={containerRef}
          id="container-0b1f8e88620f4f682b83e40675c39376"
          className="min-h-[90px] flex items-center justify-center overflow-hidden"
        />
      </div>
    </div>
  );
}
