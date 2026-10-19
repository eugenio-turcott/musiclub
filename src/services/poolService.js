// src/services/poolService.js
import { supabase, supabaseService } from './supabaseClient.js';
import { authenticatedFetch } from './authenticatedFetch.js';

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
      is_active: false,
      is_open: false,
      description: seasonData.description || '',
    };

    const { error: insertError } = await supabase.from('seasons').insert(newSeason);
    if (insertError) throw new Error(insertError.message);
    if (seasonData.is_active) { await poolService.setActiveSeason(newId); newSeason.is_active = true; }

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
    const { is_active, ...fields } = seasonData;
    const { error: updateError } = await supabase.from('seasons').update(fields).eq('id', seasonId);
    if (updateError) throw new Error(updateError.message);
    if (is_active) await poolService.setActiveSeason(seasonId);

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
    const { error: deleteError } = await supabase.from('seasons').delete().eq('id', seasonId);
    if (deleteError) throw new Error(deleteError.message);

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
    const { error } = await supabase.rpc('musiclub_activate_season', { p_season_id: seasonId });
    if (error) throw new Error(error.message);

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
  getPoolData: async (seasonId) => {
    const seasons = await poolService.getSeasons();
    const season = seasons.find(item => item.id === seasonId) || seasons.find(item => item.is_active) || DEFAULT_SEASON;
    const [{ data: entries, error }, albums] = await Promise.all([
      supabase.from('public_pool_entries').select('*').eq('season_id', season.id).order('created_at', { ascending: false }),
      supabaseService.getAllAlbumsWithFullStats(),
    ]);
    if (error) throw new Error('No se pudieron cargar las propuestas del Pool');
    const byId = new Map(albums.map(album => [album.id, album]));
    const active = [], history = [];
    let winner = null;
    for (const entry of entries || []) {
      const album = byId.get(entry.album_id);
      if (!album) continue;
      const item = { ...album, id: album.id, pool_entry_id: entry.id,
        album: album.album_name, artista: album.artist_name, imagen: album.image_url,
        status: entry.status, added_by: entry.nominated_by || 'Miembro',
        created_at: entry.created_at, nominated_at: entry.created_at, nomination_note: entry.note || '',
        reviews_enabled: entry.status === 'GANADOR' && entry.reviews_enabled === true && album.reviews_enabled !== false,
        spotifyLink: entry.spotify_link || album.spotify_link,
        youtubeLink: entry.youtube_link || album.youtube_link,
        appleMusicLink: entry.apple_music_link || album.apple_music_link,
        otherLink: entry.other_link || album.other_link,
      };
      if (entry.status === 'GANADOR') winner = item;
      else if (entry.status === 'ACTIVO') active.push(item);
      else history.push(item);
    }
    if (winner) {
      const { data: allowed, error: gateError } = await supabase.rpc('musiclub_can_review_album', { p_album_id: winner.id });
      winner.reviews_enabled = !gateError && allowed === true;
    }
    return { season, active, winner, history, isFromDedicatedTable: true };
  },

  /**
   * Nomina / Propone un álbum al Pool Activo de la temporada
   */
  nominateAlbumToPool: async ({ albumId, albumData, user, note = '', seasonId }) => {
    seasonId ||= (await poolService.getSeasons()).find(item => item.is_active)?.id;
    if (!user?.id) { const { data } = await supabase.auth.getUser(); user = data?.user; }
    if (!user?.id) throw new Error('Inicia sesión para proponer un release');
    const { data, error } = await supabase.rpc('musiclub_nominate_pool_release', {
      p_season_id: seasonId, p_album_id: albumId || null,
      p_album_data: albumData || {}, p_note: note,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Selecciona el álbum ganador de la semana en el Pool
   */
  selectWinner: async (albumId, seasonId) => {
    seasonId ||= (await poolService.getSeasons()).find(item => item.is_active)?.id;
    const { error } = await supabase.rpc('musiclub_pool_action', { p_season_id: seasonId, p_action: 'winner', p_album_id: albumId });
    if (error) throw new Error(error.message);

    // 4. Disparar notificación por correo a todos los miembros sobre el nuevo ganador
    if (typeof window !== 'undefined') {
      try {
        authenticatedFetch('/api/notifications/pool-winner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ albumId, seasonId }),
        }).catch((e) => console.warn('Aviso notificando ganador:', e));
      } catch (e) {}
    }

    return true;
  },

  /**
   * Gradúa el ganador actual y lo pasa al historial del Pool
   */
  archiveCurrentWinner: async (albumId, seasonId) => {
    seasonId ||= (await poolService.getSeasons()).find(item => item.is_active)?.id;
    const { error } = await supabase.rpc('musiclub_pool_action', { p_season_id: seasonId, p_action: 'graduate', p_album_id: albumId });
    if (error) throw new Error(error.message);

    // 3. Disparar notificación por correo a todos los miembros sobre la graduación y resultados
    if (typeof window !== 'undefined') {
      try {
        authenticatedFetch('/api/notifications/pool-graduated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ albumId, seasonId }),
        }).catch((e) => console.warn('Aviso notificando graduación:', e));
      } catch (e) {}
    }

    return true;
  },

  /**
   * Habilita o deshabilita las reseñas para el ganador actual del Pool
   */
  toggleWinnerReviews: async (albumId, reviewsEnabled, seasonId) => {
    seasonId ||= (await poolService.getSeasons()).find(item => item.is_active)?.id;
    const { error } = await supabase.rpc('musiclub_pool_action', { p_season_id: seasonId, p_action: 'reviews', p_album_id: albumId, p_enabled: reviewsEnabled });
    if (error) throw new Error(error.message);
    return true;
  },

  isPoolOpen: () => false,
  setPoolOpenStatus: async (isOpen, seasonId) => {
    seasonId ||= (await poolService.getSeasons()).find(item => item.is_active)?.id;
    const { error } = await supabase.rpc('musiclub_pool_action', { p_season_id: seasonId, p_action: 'proposals', p_enabled: isOpen });
    if (error) throw new Error(error.message);
    return true;
  },
};
export default poolService;
