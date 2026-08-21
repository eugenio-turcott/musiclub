// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que restablece el scroll de la ventana al inicio (top: 0, left: 0)
 * de forma inmediata cada vez que el usuario navega a una nueva ruta o página.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Si hay un hash (#seccion), desplazarse al elemento
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Desplazamiento instantáneo al principio de la página
    window.scrollTo(0, 0);

    // Fallbacks para asegurar reseteo en cualquier navegador / contenedor
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
