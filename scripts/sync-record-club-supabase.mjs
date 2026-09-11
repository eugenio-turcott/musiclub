import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { RECORD_CLUB_FALLBACK_RELEASES } from '../src/services/recordClubData.js';
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

async function syncRecordClubToSupabase() {
  console.log('🔄 Iniciando sincronización de Record Club con Supabase...');

  // 1. Verificar si la tabla existe
  const { data: testData, error: testError } = await supabase
    .from('record_club_releases')
    .select('id')
    .limit(1);

  if (testError) {
    if (testError.message.includes('relation') || testError.message.includes('schema cache') || testError.code === '42P01') {
      console.error('\n⚠️ La tabla "record_club_releases" aún no existe en tu base de datos de Supabase.');
      console.error('👉 Por favor ejecuta el archivo SQL en el Editor SQL de tu panel de Supabase:');
      console.error('   📄 supabase_create_record_club_releases.sql\n');
      process.exit(1);
    } else {
      console.error('❌ Error al conectar con Supabase:', testError.message);
      process.exit(1);
    }
  }

  // 2. Intentar obtener data fresca de Record Club o usar snapshot verificado
  let rawReleases = RECORD_CLUB_FALLBACK_RELEASES;
  try {
    console.log('📡 Consultando snapshot semanal desde Record Club (sortBy=popularity-week)...');
    const res = await fetch('https://api.record.club/releases?sortBy=popularity-week&limit=84', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(6000),
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
          };
        });
        console.log(`✅ Obtenidos ${rawReleases.length} lanzamientos en vivo desde Record Club.`);
      }
    }
  } catch (err) {
    console.warn(`⚠️ No se pudo conectar a la API en vivo (${err.message}). Usando el dataset verificado de 84 álbumes.`);
  }

  // 3. Formatear y preparar para Supabase
  const rows = rawReleases.map((item, index) => {
    return {
      id: item.id || `rc_${index + 1}`,
      album_name: item.album_name,
      artist_name: item.artist_name,
      image_url: item.image_url,
      release_date: item.release_date || '2026-09-01',
      release_type: item.release_type || 'ALBUM',
      total_tracks: item.total_tracks || 12,
      trending_rank: item.trending_rank || index + 1,
      popularity_raw: item.popularity_raw || 50,
      popularity_this_week: item.popularity_this_week || `${item.popularity_raw || 50} pts`,
      genre_category: item.genre_category || 'POP / ALTERNATIVE',
      badge: item.badge || null,
      hit_track: item.hit_track || item.album_name,
      is_new: item.is_new ?? false,
      record_club_url: item.record_club_url || null,
      slug: slugifyRelease(item.artist_name, item.album_name),
      artist_slug: slugifyArtist(item.artist_name),
      updated_at: new Date().toISOString(),
    };
  });

  // 4. Upsert por lotes en Supabase
  console.log(`💾 Guardando ${rows.length} registros en la tabla "record_club_releases"...`);
  const chunkSize = 25;
  let savedCount = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: upsertErr } = await supabase
      .from('record_club_releases')
      .upsert(chunk, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`❌ Error al insertar lote ${i}-${i + chunk.length}:`, upsertErr.message);
    } else {
      savedCount += chunk.length;
    }
  }

  console.log(`\n🎉 Sincronización exitosa: ${savedCount} lanzamientos almacenados en Supabase.`);
  console.log('Ahora la app puede consultar directamente desde la tabla "record_club_releases" con 0 saturación a Record Club.');
}

syncRecordClubToSupabase().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
