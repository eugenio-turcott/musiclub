import React from 'react';

export function AlbumGallery({ albums, loading, error, winner }) {
  return (
    <div
      style={{
        marginTop: '28px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingTop: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h3
          style={{
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '1.8px',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          📚 Todos los álbumes
        </h3>
        <span
          style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            padding: '2px 14px',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {albums.length}
        </span>
      </div>

      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            padding: '15px 0',
            color: 'rgba(255,255,255,0.2)',
            fontSize: '0.8rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              background: '#f5576c',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'pulseDot 1.4s infinite ease-in-out both',
            }}
          />
          <span
            style={{
              width: '8px',
              height: '8px',
              background: '#f5576c',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'pulseDot 1.4s infinite ease-in-out both',
              animationDelay: '-0.16s',
            }}
          />
          <span
            style={{
              width: '8px',
              height: '8px',
              background: '#f5576c',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'pulseDot 1.4s infinite ease-in-out both',
              animationDelay: '-0.32s',
            }}
          />
          Cargando...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
            gap: '12px',
          }}
        >
          {albums.map((album, idx) => {
            const isWinner = winner && winner.album === album.album;
            return (
              <div
                key={idx}
                style={{
                  aspectRatio: '1/1',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `2px solid ${isWinner ? 'rgba(245,87,108,0.4)' : 'rgba(255,255,255,0.04)'}`,
                  background: '#15152a',
                  transition: 'all 0.2s',
                  boxShadow: isWinner
                    ? '0 0 30px rgba(245,87,108,0.2)'
                    : 'none',
                }}
              >
                <img
                  src={album.imagen}
                  alt={album.album}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div
          style={{
            textAlign: 'center',
            color: '#f5576c',
            fontSize: '0.8rem',
            marginTop: '10px',
            padding: '10px 16px',
            background: 'rgba(245,87,108,0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(245,87,108,0.1)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
