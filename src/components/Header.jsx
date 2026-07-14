import React from 'react';

export function Header() {
  return (
    <div className="text-center mb-8">
      {/* TEXTO DE NEÓN CORREGIDO: luz blanca con brillo rosa/rojo */}
      <h1
        className="title-albumes text-6xl md:text-8xl font-black tracking-tight"
        style={{
          color: '#ffffff',
          textShadow:
            '0 0 7px rgba(245,87,108,0.3), 0 0 10px rgba(245,87,108,0.2), 0 0 21px rgba(245,87,108,0.15), 0 0 42px rgba(245,87,108,0.1)',
        }}
      >
        MÁQUINA MUSICAL
      </h1>

      <p className="text-white/60 tracking-[0.2em] text-sm md:text-base mt-2">
        Sistema de selección de álbumes - AZAR
      </p>
    </div>
  );
}
