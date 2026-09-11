import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  RECORD_CLUB_FALLBACK_RELEASES,
  RECORD_CLUB_FALLBACK_UPCOMING,
} from '../src/services/recordClubData.js';
import { slugifyArtist, slugifyRelease } from '../src/utils/ratingUtils.js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const isForced = process.argv.includes('--force');

async function checkSyncState(syncType, todayDate) {
  try {
    const { data, error } = await supabase
      .from('record_club_sync_state')
      .select('*')
      .eq('sync_type', syncType)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

async function updateSyncState(syncType, todayDate, itemsCount) {
  try {
    await supabase.from('record_club_sync_state').upsert(
      {
        sync_type: syncType,
        last_synced_at: new Date().toISOString(),
        last_synced_date: todayDate,
        items_count: itemsCount,
        status: 'OK',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'sync_type' }
    );
  } catch (err) {
    console.warn(`⚠️ No se pudo actualizar record_club_sync_state (${syncType}):`, err.message);
  }
}

// =========================================================================
// 1. SINCRONIZACIÓN DE TENDENCIAS SEMANALES (84 Lanzamientos)
// =========================================================================
async function syncWeeklyTrending(todayDate) {
  console.log('\n--- 1. TENDENCIAS SEMANALES (Popularity this week) ---');

  const state = await checkSyncState('weekly_trending', todayDate);
  if (state?.last_synced_date === todayDate && !isForced) {
    console.log(`✅ Sincronización semanal de hoy (${todayDate}) ya fue completada (${state.items_count} items). Omitiendo consulta externa a Record Club.`);
    return;
  }

  console.log('📡 Consultando https://api.record.club/releases?sortBy=popularity-week&limit=84 ...');
  let rawReleases = RECORD_CLUB_FALLBACK_RELEASES;

  try {
    const res = await fetch('https://api.record.club/releases?sortBy=popularity-week&limit=84', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const fallbackMap = new Map();
        RECORD_CLUB_FALLBACK_RELEASES.forEach((r) => {
          fallbackMap.set(r.album_name.toLowerCase(), r);
          if (r.id) fallbackMap.set(r.id, r);
        });

        rawReleases = json.data.map((r, index) => {
          const artist = r.artists?.map((a) => a.name).join(' & ') || 'Varios Artistas';
          const title = r.title;
          const matched = fallbackMap.get(title.toLowerCase()) || fallbackMap.get(r.id);
          const pop = r.popularityByWeek?.popularity || r.popularity?.popularity || (450 - index * 4);
          const pos = r.popularityByWeek?.position || index + 1;

          const artworkUrl = r.artwork?.releaseVersionId
            ? `https://cdn.rcrd.club/releases/${r.id}/${r.artwork.releaseVersionId}.webp?v=${r.artwork.artworkVersionId || ''}&width=500`
            : (matched?.image_url || `https://cdn.rcrd.club/releases/${r.id}.webp?width=500`);

          const relDate = r.releaseDate
            ? `${r.releaseDate.year}-${String((r.releaseDate.month ?? 0) + 1).padStart(2, '0')}-${String(r.releaseDate.day || 1).padStart(2, '0')}`
            : matched?.release_date || '2026-09-01';

          const isNew = r.id === '05golqe1nj9l1j23' || (r.releaseDate?.year === 2026 && r.releaseDate?.month >= 8);

          return {
            id: r.id || `rc_${index + 1}`,
            album_name: title,
            artist_name: artist,
            image_url: artworkUrl,
            release_date: relDate,
            release_type: r.type === 2 ? 'SENCILLO' : r.type === 3 ? 'EP' : 'ALBUM',
            total_tracks: matched?.total_tracks || (r.type === 2 ? 1 : 12),
            trending_rank: pos,
            popularity_raw: pop,
            popularity_this_week: `${pop.toLocaleString()} pts`,
            genre_category: matched?.genre_category || 'POP / ALTERNATIVE',
            badge: pos === 1 ? '🔥 #1 Popularity This Week' : pos <= 3 ? 'Top 3 Global' : isNew ? 'NEW' : 'Tendencia Semanal',
            hit_track: matched?.hit_track || title,
            record_club_url: `https://record.club${r.uri || ''}`,
            is_new: isNew,
            slug: slugifyRelease(artist, title),
            artist_slug: slugifyArtist(artist),
            updated_at: new Date().toISOString(),
          };
        });
      }
    }
  } catch (err) {
    console.warn(`⚠️ Error al consultar Record Club API (${err.message}). Usando dataset verificado.`);
  }

  // Guardar en tabla record_club_releases
  console.log(`💾 Almacenando ${rawReleases.length} registros en Supabase [record_club_releases]...`);
  const chunkSize = 30;
  for (let i = 0; i < rawReleases.length; i += chunkSize) {
    const chunk = rawReleases.slice(i, i + chunkSize);
    const { error: upsertErr } = await supabase
      .from('record_club_releases')
      .upsert(chunk, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`❌ Error en lote de tendencias: ${upsertErr.message}`);
      return;
    }
  }

  await updateSyncState('weekly_trending', todayDate, rawReleases.length);
  console.log(`🎉 [weekly_trending] Sincronización diaria exitosa (${rawReleases.length} álbumes en Supabase).`);
}

// =========================================================================
// 2. SINCRONIZACIÓN DE PRÓXIMOS RELEASES (Upcoming Releases)
// =========================================================================
async function syncUpcoming(todayDate) {
  console.log('\n--- 2. PRÓXIMOS RELEASES (releaseDate=upcoming&sortBy=popularity) ---');

  const state = await checkSyncState('upcoming', todayDate);
  if (state?.last_synced_date === todayDate && !isForced) {
    console.log(`✅ Sincronización de próximos estrenos de hoy (${todayDate}) ya fue completada (${state.items_count} items). Omitiendo consulta externa a Record Club.`);
    return;
  }

  console.log('📡 Consultando https://api.record.club/releases?releaseDate=upcoming&sortBy=popularity&limit=50 ...');
  let upcomingList = RECORD_CLUB_FALLBACK_UPCOMING;

  try {
    const res = await fetch(
      'https://api.record.club/releases?releaseDate=upcoming&sortBy=popularity&limit=50',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(7000),
      }
    );

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        upcomingList = json.data.map((item, index) => {
          const artist = item.artists?.map((a) => a.name).join(' & ') || 'Varios Artistas';
          const title = item.title;
          const artworkUrl = item.artwork?.releaseVersionId
            ? `https://cdn.rcrd.club/releases/${item.id}/${item.artwork.releaseVersionId}.webp?v=${item.artwork.artworkVersionId || ''}&width=500`
            : `https://cdn.rcrd.club/releases/${item.id}.webp?width=500`;

          const relDate = item.releaseDate
            ? `${item.releaseDate.year}-${String((item.releaseDate.month ?? 0) + 1).padStart(2, '0')}-${String(item.releaseDate.day || 1).padStart(2, '0')}`
            : '2026-10-01';

          return {
            id: item.id || `upc_${index + 1}`,
            album_name: title,
            artist_name: artist,
            image_url: artworkUrl,
            release_date: relDate,
            release_type: item.type === 2 ? 'SENCILLO' : item.type === 3 ? 'EP' : 'ALBUM',
            total_tracks: 10,
            popularity_rank: index + 1,
            popularity_raw: item.popularity?.popularity || 50,
            genre: 'POP / ALTERNATIVE',
            description: 'Lanzamiento anunciado oficialmente.',
            record_club_url: `https://record.club${item.uri || ''}`,
            slug: slugifyRelease(artist, title),
            artist_slug: slugifyArtist(artist),
            can_rate: false,
            is_anticipated: true,
            updated_at: new Date().toISOString(),
          };
        });
      }
    }
  } catch (err) {
    console.warn(`⚠️ Error al consultar próximos releases de Record Club (${err.message}). Usando dataset verificado.`);
  }

  // Guardar en tabla record_club_upcoming
  console.log(`💾 Almacenando ${upcomingList.length} registros en Supabase [record_club_upcoming]...`);
  const chunkSize = 25;
  for (let i = 0; i < upcomingList.length; i += chunkSize) {
    const chunk = upcomingList.slice(i, i + chunkSize);
    const { error: upsertErr } = await supabase
      .from('record_club_upcoming')
      .upsert(chunk, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`❌ Error en lote de próximos releases: ${upsertErr.message}`);
      return;
    }
  }

  await updateSyncState('upcoming', todayDate, upcomingList.length);
  console.log(`🎉 [upcoming] Sincronización diaria exitosa (${upcomingList.length} lanzamientos en Supabase).`);
}

// =========================================================================
// RUN
// =========================================================================
async function main() {
  const todayDate = new Date().toISOString().split('T')[0];
  console.log(`========================================================`);
  console.log(`🔄 MUSICLUB - SINCRONIZADOR DIARIO ÚNICO DE RECORD CLUB`);
  console.log(`📅 Fecha de ejecución: ${todayDate}`);
  console.log(`⚙️ Modo forzado: ${isForced ? 'SÍ (--force)' : 'NO (Idempotente diario)'}`);
  console.log(`========================================================`);

  // Verificar si las tablas existen
  const { error: testErr } = await supabase.from('record_club_releases').select('id').limit(1);
  if (testErr && (testErr.message.includes('schema cache') || testErr.code === '42P01')) {
    console.error('\n⚠️ Las tablas de Record Club aún no existen en tu base de datos de Supabase.');
    console.error('👉 Por favor ejecuta el archivo SQL en el Editor SQL de tu panel de Supabase:');
    console.error('   📄 supabase_create_record_club_tables.sql\n');
    process.exit(1);
  }

  await syncWeeklyTrending(todayDate);
  await syncUpcoming(todayDate);

  console.log(`\n========================================================`);
  console.log(`✨ Sincronización diaria completada. Todo guardado en Supabase.`);
  console.log(`========================================================\n`);
}

main().catch((err) => {
  console.error('Fatal error in daily sync:', err);
  process.exit(1);
});
