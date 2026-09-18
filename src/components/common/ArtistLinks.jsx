import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { splitArtists, slugifyArtist } from '../../utils/ratingUtils';
import { supabaseService } from '../../services/supabaseClient';
import { registerUntranslatableEntities } from '../../utils/translateCrashGuard';

/**
 * Renderiza de forma separada e interactiva cada artista en lanzamientos colaborativos o con múltiples créditos.
 * Protegido contra traducción automática en todos los idiomas del club (V.8.11).
 * Ejemplo: "piri & tommy, piri, Tommy Villiers"
 * -> 3 enlaces separados e individuales a:
 *    - /artista/piri-and-tommy
 *    - /artista/piri
 *    - /artista/tommy-villiers
 * Registra el click en la base de datos para la indexación y analítica de artistas en Musiclub.
 */
export default function ArtistLinks({
  artistName,
  className = '',
  linkClassName = 'hover:text-purple-400 hover:underline transition-colors',
  separator = ', ',
  stopPropagation = true,
  onClick,
}) {
  const artists = artistName ? splitArtists(artistName) : [];

  useEffect(() => {
    if (artistName) {
      registerUntranslatableEntities({
        artists: [artistName, ...(artists || []).map((a) => a.name)].filter(Boolean),
      });
    }
  }, [artistName, artists]);

  if (!artistName) return null;

  if (!artists || artists.length === 0) {
    const fallbackSlug = slugifyArtist(artistName);
    return (
      <Link
        to={`/artista/${fallbackSlug}`}
        translate="no"
        className={`notranslate artist-name ${linkClassName}`}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          supabaseService.recordArtistClick(artistName);
          if (onClick) onClick(e);
        }}
      >
        {artistName}
      </Link>
    );
  }

  return (
    <span
      translate="no"
      className={`notranslate artist-name inline-flex flex-wrap items-center ${className}`}
    >
      {artists.map((art, index) => {
        const isLast = index === artists.length - 1;
        return (
          <React.Fragment key={`${art.slug}-${index}`}>
            <Link
              to={`/artista/${art.slug}`}
              translate="no"
              className={`notranslate artist-name ${linkClassName}`}
              title={`Ver discografía de ${art.name}`}
              onClick={(e) => {
                if (stopPropagation) e.stopPropagation();
                // Registrar click en la base de datos Supabase
                supabaseService.recordArtistClick(art.name);
                if (onClick) onClick(e, art);
              }}
            >
              {art.name}
            </Link>
            {!isLast && (
              <span className="text-zinc-500 mr-1 select-none">
                {separator}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
}

export { ArtistLinks };
