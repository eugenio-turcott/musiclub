import React from 'react';

export function WinnerPopup({ winner, onClose }) {
  if (!winner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.4s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '40px',
          padding: '40px 40px 50px',
          maxWidth: '480px',
          width: '90%',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
          textAlign: 'center',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: 'relative',
            width: '240px',
            height: '240px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: '#111',
            boxShadow:
              '0 0 0 12px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={winner.imagen}
            alt={winner.album}
            style={{
              width: '85%',
              height: '85%',
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #666, #222)',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 20px rgba(0,0,0,0.6)',
            }}
          />
        </div>
        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          {winner.album}
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '1rem',
            margin: '6px 0 12px',
          }}
        >
          {winner.artista}
        </p>
        <div
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
            padding: '6px 24px',
            borderRadius: '50px',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#fff',
          }}
        >
          🏆 Ganador
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            padding: '10px 28px',
            borderRadius: '40px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
