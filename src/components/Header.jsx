import React from 'react';

export function Header() {
  return (
    <div className="text-center mb-6 md:mb-8">
      <h1
        className="title-albumes text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight"
        style={{
          color: '#ffffff',
          textShadow:
            '0 0 7px rgba(245,87,108,0.3), 0 0 10px rgba(245,87,108,0.2), 0 0 21px rgba(245,87,108,0.15), 0 0 42px rgba(245,87,108,0.1)',
        }}
      >
        MÁQUINA MUSICAL
      </h1>

      <p className="text-white/60 tracking-[0.15em] sm:tracking-[0.2em] text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
        Sistema de selección de álbumes - AZAR
      </p>
    </div>
  );
}
