// scripts/execute_all_track_fixes.mjs
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
dotenv.config({ path: './.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Error: Credenciales de Supabase no encontradas.');
  process.exit(1);
}

const supabase = createClient(url, key);

function normalizeStr(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’"“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log('🚀 INICIANDO MIGRACIÓN DEFINITIVA DE TRACK IDs EN SUPABASE...\n');

  // 1. Cargar datos de los 12 álbumes preparados
  const repaired12Albums = JSON.parse(fs.readFileSync('scripts/12_albums_final_tracks.json', 'utf-8'));

  // 2. Obtener todos los álbumes y reviews de la base de datos
  console.log('📦 Descargando álbumes y reviews actuales...');
  let allAlbums = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from('albums').select('*').range(from, from + 999);
    if (error) throw error;
    allAlbums = allAlbums.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  let allReviews = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase.from('reviews').select('*').range(from, from + 999);
    if (error) throw error;
    allReviews = allReviews.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`  -> Álbumes descargados: ${allAlbums.length}`);
  console.log(`  -> Reviews descargadas: ${allReviews.length}`);

  // 3. Crear Backup de Seguridad
  const backup = {
    timestamp: new Date().toISOString(),
    albums: allAlbums.map(a => ({ id: a.id, album_name: a.album_name, artist_name: a.artist_name, tracks: a.tracks })),
    reviews: allReviews.map(r => ({ id: r.id, album_id: r.album_id, reviewer_name: r.reviewer_name, track_ratings: r.track_ratings, favorite_track: r.favorite_track })),
  };
  fs.writeFileSync('scripts/backup_before_track_fixes.json', JSON.stringify(backup, null, 2));
  console.log('💾 Backup de seguridad guardado en scripts/backup_before_track_fixes.json\n');

  const albumMap = new Map();
  allAlbums.forEach(a => albumMap.set(a.id, a));

  // 4. Preparar actualizaciones de Álbumes
  const updatedAlbumsMap = new Map();

  for (const [albId, tracks] of Object.entries(repaired12Albums)) {
    updatedAlbumsMap.set(albId, tracks);
  }

  // Little Jesus - Disco de Oro (añadir bonus tracks)
  const ljId = '90c75a60-9a81-4879-864d-757c17a80755';
  const lj = albumMap.get(ljId);
  if (lj && Array.isArray(lj.tracks)) {
    const tracks = [...lj.tracks];
    if (!tracks.some(t => t.name === 'Copa del Mundo')) {
      tracks.push({
        id: '63pqKVbcr55rwQ8QZ0NyQJ',
        name: 'Copa del Mundo',
        track_number: 12,
        duration_ms: 226160,
      });
    }
    if (!tracks.some(t => t.name === 'Video Club Amores')) {
      tracks.push({
        id: '0KgiNELjv8XGVU7vnR2Mcm',
        name: 'Video Club Amores',
        track_number: 13,
        duration_ms: 227000,
      });
    }
    updatedAlbumsMap.set(ljId, tracks);
  }

  // 5. Aplicar actualizaciones en la tabla `albums`
  console.log(`💿 Actualizando ${updatedAlbumsMap.size} álbumes en Supabase...`);
  for (const [albId, tracks] of updatedAlbumsMap.entries()) {
    const current = albumMap.get(albId);
    console.log(`  Updating album: ${current?.artist_name} - ${current?.album_name} (${tracks.length} tracks)...`);
    const { error } = await supabase
      .from('albums')
      .update({
        tracks: tracks,
        total_tracks: tracks.length,
      })
      .eq('id', albId);

    if (error) {
      console.error(`  ❌ Error actualizando álbum ${albId}:`, error.message);
    } else {
      console.log(`  ✅ Álbum ${albId} actualizado.`);
    }
  }

  // 6. Preparar actualizaciones de Reviews
  console.log('\n✍️ Calculando actualizaciones necesarias para las reseñas...');
  const reviewsToUpdate = [];

  for (const rev of allReviews) {
    if (!rev.track_ratings || typeof rev.track_ratings !== 'object' || Object.keys(rev.track_ratings).length === 0) {
      continue;
    }

    const alb = albumMap.get(rev.album_id);
    if (!alb) continue;

    const albumTracks = updatedAlbumsMap.get(alb.id) || (Array.isArray(alb.tracks) ? alb.tracks : []);

    const idMap = new Map();
    const nameMap = new Map();
    const numberMap = new Map();

    albumTracks.forEach((t, idx) => {
      const tid = typeof t === 'object' ? String(t.id || t.spotify_id || '') : '';
      const tname = typeof t === 'object' ? (t.name || '') : String(t);
      const tnum = typeof t === 'object' ? (t.track_number || idx + 1) : idx + 1;

      if (tid) idMap.set(tid, t);
      if (tname) {
        nameMap.set(normalizeStr(tname), t);
      }
      numberMap.set(tnum, t);
    });

    const oldMbTracks = Array.isArray(alb.tracks) ? alb.tracks : [];
    const oldTrackById = new Map();
    oldMbTracks.forEach(t => {
      if (typeof t === 'object' && t.id) {
        oldTrackById.set(String(t.id), t);
      }
    });

    const resolveKey = (rawKey) => {
      const strKey = String(rawKey).trim();
      const normKey = normalizeStr(strKey);

      if (idMap.has(strKey)) return strKey;

      if (nameMap.has(normKey)) {
        const t = nameMap.get(normKey);
        return typeof t === 'object' ? String(t.id || t.name) : t;
      }

      if (oldTrackById.has(strKey)) {
        const oldT = oldTrackById.get(strKey);
        const oldNormName = normalizeStr(oldT.name);
        if (nameMap.has(oldNormName)) {
          const t = nameMap.get(oldNormName);
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
        if (oldT.track_number && numberMap.has(oldT.track_number)) {
          const t = numberMap.get(oldT.track_number);
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
      }

      // Typos conocidos
      if (normKey.includes('stereo coloured cloud') || normKey.includes('stereo colour cloud')) {
        for (const [k, t] of nameMap.entries()) {
          if (k.includes('stereo colour cloud') || k.includes('stereo coloured cloud')) {
            return typeof t === 'object' ? String(t.id || t.name) : t;
          }
        }
      }

      if (normKey.includes('solo porque sabia que tenia que tomar una decision')) {
        for (const [k, t] of nameMap.entries()) {
          if (k.includes('solo porque sabia que tenia que tomar una decision')) {
            return typeof t === 'object' ? String(t.id || t.name) : t;
          }
        }
      }

      for (const [tNorm, t] of nameMap.entries()) {
        if (tNorm.length > 3 && (tNorm.includes(normKey) || normKey.includes(tNorm))) {
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
        const b1 = tNorm.split(' - ')[0].trim();
        const b2 = normKey.split(' - ')[0].trim();
        if (b1.length > 3 && b1 === b2) {
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
      }

      return null;
    };

    const newTrackRatings = {};
    let changed = false;

    for (const [k, v] of Object.entries(rev.track_ratings)) {
      const resolved = resolveKey(k);
      if (resolved) {
        newTrackRatings[resolved] = v;
        if (resolved !== k) changed = true;
      } else {
        newTrackRatings[k] = v;
      }
    }

    let newFavoriteTrack = rev.favorite_track;
    if (rev.favorite_track) {
      const resolvedFav = resolveKey(rev.favorite_track);
      if (resolvedFav && resolvedFav !== rev.favorite_track) {
        newFavoriteTrack = resolvedFav;
        changed = true;
      }
    }

    if (changed) {
      reviewsToUpdate.push({
        id: rev.id,
        reviewer_name: rev.reviewer_name,
        album_name: alb.album_name,
        track_ratings: newTrackRatings,
        favorite_track: newFavoriteTrack,
      });
    }
  }

  console.log(`  -> Reviews que requieren actualización de keys: ${reviewsToUpdate.length}`);

  // 7. Aplicar actualizaciones en la tabla `reviews`
  console.log('\n📝 Aplicando cambios en la tabla reviews...');
  let updatedCount = 0;
  for (const rev of reviewsToUpdate) {
    const { error } = await supabase
      .from('reviews')
      .update({
        track_ratings: rev.track_ratings,
        favorite_track: rev.favorite_track,
      })
      .eq('id', rev.id);

    if (error) {
      console.error(`  ❌ Error en review ${rev.id} (${rev.reviewer_name} - ${rev.album_name}):`, error.message);
    } else {
      updatedCount++;
    }
  }

  console.log(`\n🎉 Migración completada exitosamente:`);
  console.log(`  - Álbumes actualizados: ${updatedAlbumsMap.size}`);
  console.log(`  - Reseñas actualizadas: ${updatedCount} / ${reviewsToUpdate.length}`);
}

main().catch(err => {
  console.error('Error fatal durante la migración:', err);
  process.exit(1);
});
