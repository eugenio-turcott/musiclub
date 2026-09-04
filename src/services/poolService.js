// src/services/poolService.js
import { supabase } from './supabaseClient';

/**
 * Metadata de las Temporadas de Musiclub
 */
export const DEFAULT_SEASON = {
  id: 'temporada-1',
  season_number: 1,
  name: 'Temporada 1: El Origen del Club',
  start_date: '2026-07-11',
  end_date: null, // Sigue presente / activa
  is_active: true,
  description:
    'La primera temporada oficial de Musiclub. Iniciada el 11 de julio de 2026, donde la comunidad propone álbumes, EPs y canciones al Pool para ser elegidos semanalmente.',
};

export const ALL_SEASONS = [
  DEFAULT_SEASON,
];

/**
 * Servicio para la gestión del Pool Musical por Temporadas
 */
export const poolService = {
  /**
   * Obtiene la temporada activa actual
   */
  getCurrentSeason: () => {
    try {
      const stored = localStorage.getItem('musiclub_seasons');
      if (stored) {
        const parsed = JSON.parse(stored);
        const active = parsed.find((s) => s.is_active);
        if (active) return active;
      }
    } catch (e) {}
    return DEFAULT_SEASON;
  },

  /**
   * Obtiene todas las temporadas
   */
  getAllSeasons: () => {
    try {
      const stored = localStorage.getItem('musiclub_seasons');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ALL_SEASONS;
  },

  /**
   * Carga temporadas de forma asíncrona desde Supabase o localStorage
   */
  getSeasons: async () => {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('season_number', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        localStorage.setItem('musiclub_seasons', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      // Ignorar si la tabla seasons aún no está en Supabase
    }
    try {
      const stored = localStorage.getItem('musiclub_seasons');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return ALL_SEASONS;
  },

  /**
   * Crea una nueva temporada
   */
  createSeason: async (seasonData) => {
    const num = parseInt(seasonData.season_number, 10) || 1;
    const newId = seasonData.id || `temporada-${num}-${Date.now()}`;
    const newSeason = {
      id: newId,
      season_number: num,
      name: seasonData.name || `Temporada ${num}`,
      start_date: seasonData.start_date || new Date().toISOString().split('T')[0],
      end_date: seasonData.end_date || null,
      is_active: Boolean(seasonData.is_active),
      description: seasonData.description || '',
    };

    try {
      await supabase.from('seasons').insert(newSeason);
    } catch (e) {}

    const current = await poolService.getSeasons();
    let updated = [...current.filter((s) => s.id !== newId), newSeason];
    if (newSeason.is_active) {
      updated = updated.map((s) => (s.id === newId ? s : { ...s, is_active: false }));
    }
    updated.sort((a, b) => (a.season_number || 0) - (b.season_number || 0));
    localStorage.setItem('musiclub_seasons', JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('musiclub_seasons_change', { detail: { seasons: updated } })
      );
    }
    return newSeason;
  },

  /**
   * Actualiza una temporada existente
   */
  updateSeason: async (seasonId, seasonData) => {
    try {
      await supabase.from('seasons').update(seasonData).eq('id', seasonId);
    } catch (e) {}

    const current = await poolService.getSeasons();
    let updated = current.map((s) => (s.id === seasonId ? { ...s, ...seasonData } : s));
    if (seasonData.is_active) {
      updated = updated.map((s) => (s.id === seasonId ? s : { ...s, is_active: false }));
    }
    updated.sort((a, b) => (a.season_number || 0) - (b.season_number || 0));
    localStorage.setItem('musiclub_seasons', JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('musiclub_seasons_change', { detail: { seasons: updated } })
      );
    }
    return true;
  },

  /**
   * Elimina una temporada
   */
  deleteSeason: async (seasonId) => {
    try {
      await supabase.from('seasons').delete().eq('id', seasonId);
    } catch (e) {}

    const current = await poolService.getSeasons();
    let updated = current.filter((s) => s.id !== seasonId);
    if (updated.length === 0) {
      updated = ALL_SEASONS;
    }
    localStorage.setItem('musiclub_seasons', JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('musiclub_seasons_change', { detail: { seasons: updated } })
      );
    }
    return true;
  },

  /**
   * Activa una temporada específica
   */
  setActiveSeason: async (seasonId) => {
    try {
      await supabase.from('seasons').update({ is_active: false }).neq('id', seasonId);
      await supabase.from('seasons').update({ is_active: true }).eq('id', seasonId);
    } catch (e) {}

    const current = await poolService.getSeasons();
    const updated = current.map((s) => ({
      ...s,
      is_active: s.id === seasonId,
    }));
    localStorage.setItem('musiclub_seasons', JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('musiclub_seasons_change', { detail: { seasons: updated } })
      );
    }
    return true;
  },

  /**
   * Carga los datos del Pool de una temporada:
   * 1. Álbumes Activos (en espera en el Pool)
   * 2. Álbum Ganador actual (en foco esta semana)
   * 3. Álbumes Graduados / Históricos del Pool
   */
  getPoolData: async (seasonId = DEFAULT_SEASON.id) => {
    try {
      // 1. Intentar consultar tabla dedicada `pool_entries` si existe
      const { data: poolEntries, error: poolError } = await supabase
        .from('pool_entries')
        .select(
          `
          *,
          album:album_id (*)
        `
        )
        .eq('season_id', seasonId)
        .order('created_at', { ascending: false });

      if (!poolError && Array.isArray(poolEntries) && poolEntries.length > 0) {
        const active = [];
        let winner = null;
        const history = [];

        poolEntries.forEach((entry) => {
          const albumObj = entry.album || {};
          const item = {
            id: albumObj.id || entry.album_id,
            pool_entry_id: entry.id,
            album: albumObj.album_name,
            artista: albumObj.artist_name,
            imagen: albumObj.image_url,
            spotifyLink: albumObj.spotify_link,
            youtubeLink: albumObj.youtube_link,
            appleMusicLink: albumObj.apple_music_link,
            status: entry.status,
            added_by: entry.nominated_by || albumObj.added_by,
            added_by_email: entry.nominated_by_email || albumObj.added_by_email,
            user_id: entry.user_id || null,
            created_at: entry.created_at || albumObj.created_at,
            nominated_at: entry.created_at,
            nomination_note: entry.note || '',
            tracks: albumObj.tracks || [],
            reviews_enabled: albumObj.reviews_enabled || entry.reviews_enabled || false,
            final_rating: albumObj.final_rating,
            avg_rating: albumObj.avg_rating,
            review_count: albumObj.review_count || 0,
            release_type: albumObj.release_type,
          };

          if (entry.status === 'GANADOR') {
            winner = item;
          } else if (entry.status === 'ACTIVO') {
            active.push(item);
          } else {
            history.push(item);
          }
        });

        return {
          season: DEFAULT_SEASON,
          active,
          winner,
          history,
          isFromDedicatedTable: true,
        };
      }
    } catch (err) {
      // Fallback a albums si pool_entries no existe aún
      console.info('pool_entries table not detected or empty, using albums fallback:', err?.message);
    }

    // Fallback Universal: Utilizar la tabla `albums` existente
    const { data: allAlbums, error: albumsError } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (albumsError) throw new Error(albumsError.message);

    const active = [];
    let winner = null;
    const history = [];

    (allAlbums || []).forEach((alb) => {
      const item = {
        id: alb.id,
        album: alb.album_name,
        artista: alb.artist_name,
        imagen: alb.image_url,
        spotifyLink: alb.spotify_link,
        youtubeLink: alb.youtube_link,
        appleMusicLink: alb.apple_music_link,
        status: alb.status,
        added_by: alb.added_by,
        added_by_email: alb.added_by_email,
        created_at: alb.created_at,
        tracks: alb.tracks || [],
        spotify_verified: alb.spotify_verified || false,
        reviews_enabled: alb.reviews_enabled || false,
        final_rating: alb.final_rating,
        avg_rating: alb.avg_rating,
        review_count: alb.review_count || 0,
        release_type: alb.release_type,
      };

      if (alb.status === 'GANADOR') {
        winner = item;
      } else if (alb.status === 'ACTIVO') {
        active.push(item);
      } else if (alb.status === 'INACTIVO') {
        history.push(item);
      }
    });

    return {
      season: DEFAULT_SEASON,
      active,
      winner,
      history,
      isFromDedicatedTable: false,
    };
  },

  /**
   * Nomina / Propone un álbum al Pool Activo de la temporada
   */
  nominateAlbumToPool: async ({ albumId, albumData, user, note = '' }) => {
    // 1. Si no tiene albumId, asegurarse de que existe en la tabla universal `albums`
    let targetAlbumId = albumId;

    if (!targetAlbumId && albumData) {
      // Buscar si ya existe por nombre y artista
      const { data: existing } = await supabase
        .from('albums')
        .select('id')
        .eq('album_name', albumData.albumName || albumData.album)
        .eq('artist_name', albumData.artistName || albumData.artista)
        .maybeSingle();

      if (existing?.id) {
        targetAlbumId = existing.id;
      } else {
        // Insertar en la tabla universal `albums`
        const { data: inserted, error: insertError } = await supabase
          .from('albums')
          .insert([
            {
              album_name: albumData.albumName || albumData.album,
              artist_name: albumData.artistName || albumData.artista,
              image_url: albumData.imageUrl || albumData.imagen,
              spotify_link: albumData.spotifyLink || null,
              youtube_link: albumData.youtubeLink || null,
              apple_music_link: albumData.appleMusicLink || null,
              status: 'ACTIVO',
              added_by: user?.name || user?.email?.split('@')[0] || albumData.addedBy || 'Miembro',
              added_by_email: user?.email || albumData.addedByEmail || null,
              user_id: user?.id || null,
              tracks: albumData.tracks || [],
              spotify_verified: true,
              reviews_enabled: false,
              release_date: albumData.releaseDate || albumData.release_date || null,
              release_year: albumData.releaseYear || albumData.release_year || null,
            },
          ])
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);
        targetAlbumId = inserted.id;
      }
    }

    // 2. Intentar registrar en `pool_entries`
    try {
      const { error: poolInsertError } = await supabase
        .from('pool_entries')
        .insert([
          {
            season_id: DEFAULT_SEASON.id,
            album_id: targetAlbumId,
            nominated_by: user?.name || user?.email?.split('@')[0] || 'Miembro',
            nominated_by_email: user?.email || null,
            user_id: user?.id || null,
            note: note,
            status: 'ACTIVO',
          },
        ]);

      if (!poolInsertError) {
        return { success: true, albumId: targetAlbumId };
      }
    } catch (e) {
      // Fallback a actualizar status en albums
    }

    // Fallback: Actualizar estado en `albums` a 'ACTIVO'
    const { error: updateError } = await supabase
      .from('albums')
      .update({
        status: 'ACTIVO',
        added_by: user?.name || user?.email?.split('@')[0] || 'Miembro',
        added_by_email: user?.email || null,
      })
      .eq('id', targetAlbumId);

    if (updateError) throw new Error(updateError.message);
    return { success: true, albumId: targetAlbumId };
  },

  /**
   * Selecciona el álbum ganador de la semana en el Pool
   */
  selectWinner: async (albumId, seasonId = DEFAULT_SEASON.id) => {
    // 1. Desmarcar cualquier ganador previo (pasa a HISTÓRICO / INACTIVO)
    try {
      await supabase
        .from('pool_entries')
        .update({ status: 'GRADUADO' })
        .eq('season_id', seasonId)
        .eq('status', 'GANADOR');

      const { error } = await supabase
        .from('pool_entries')
        .update({ status: 'GANADOR' })
        .eq('season_id', seasonId)
        .eq('album_id', albumId);

      if (!error) {
        // También sincronizar tabla `albums`
        await supabase.from('albums').update({ reviews_enabled: true }).eq('id', albumId);
        return true;
      }
    } catch (e) {
      // Fallback
    }

    // Fallback tabla `albums`:
    const { error: winErr } = await supabase
      .from('albums')
      .update({ reviews_enabled: true })
      .eq('id', albumId);

    if (winErr) throw new Error(winErr.message);
    return true;
  },

  /**
   * Gradúa el ganador actual y lo pasa al historial del Pool
   */
  archiveCurrentWinner: async (albumId, seasonId = DEFAULT_SEASON.id) => {
    try {
      await supabase
        .from('pool_entries')
        .update({ status: 'GRADUADO' })
        .eq('season_id', seasonId)
        .eq('album_id', albumId);
    } catch (e) {}

    const { error } = await supabase
      .from('albums')
      .update({ status: 'INACTIVO' })
      .eq('id', albumId);

    if (error) throw new Error(error.message);
    return true;
  },

  /**
   * Habilita o deshabilita las reseñas para el ganador actual del Pool
   */
  toggleWinnerReviews: async (albumId, reviewsEnabled) => {
    const { error } = await supabase
      .from('albums')
      .update({ reviews_enabled: reviewsEnabled })
      .eq('id', albumId);

    if (error) throw new Error(error.message);
    return true;
  },

  /**
   * Verifica si el Pool de la temporada está abierto para nuevas propuestas
   * Por defecto: false (CERRADO)
   */
  isPoolOpen: () => {
    try {
      const stored = localStorage.getItem('musiclub_pool_is_open');
      if (stored !== null) {
        return stored === 'true';
      }
      return false; // Por defecto cerrado
    } catch {
      return false;
    }
  },

  /**
   * Actualiza el estado de apertura del Pool (Abierto / Cerrado)
   */
  setPoolOpenStatus: async (isOpen) => {
    try {
      localStorage.setItem('musiclub_pool_is_open', String(isOpen));
      // Intentar persistir en Supabase si existe seasons
      try {
        await supabase
          .from('seasons')
          .update({ is_open: isOpen })
          .eq('id', DEFAULT_SEASON.id);
      } catch (e) {
        // Ignorar si la columna aún no está creada
      }

      // Notificar a toda la app mediante evento personalizado
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('musiclub_pool_status_change', {
            detail: { isOpen: Boolean(isOpen) },
          })
        );
      }
      return true;
    } catch (err) {
      console.error('Error al cambiar estado del pool:', err);
      return false;
    }
  },
};

export default poolService;
