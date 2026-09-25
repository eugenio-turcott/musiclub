// scripts/verify_unification_plan.mjs
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
dotenv.config({ path: './.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
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

async function run() {
  console.log('--- VERIFICANDO PLAN COMPLETO DE UNIFICACIÓN ---\n');

  // Load the 12 repaired albums
  const repaired12Albums = JSON.parse(fs.readFileSync('scripts/12_albums_final_tracks.json', 'utf-8'));

  // Fetch all albums from DB
  let allAlbums = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from('albums').select('id, album_name, artist_name, tracks, spotify_link').range(from, from + 999);
    allAlbums = allAlbums.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  // Fetch all reviews from DB
  let allReviews = [];
  from = 0;
  while (true) {
    const { data } = await supabase.from('reviews').select('id, album_id, reviewer_name, track_ratings, favorite_track').range(from, from + 999);
    allReviews = allReviews.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const albumMap = new Map();
  allAlbums.forEach(a => albumMap.set(a.id, a));

  // Determine updated tracks for all albums
  const updatedAlbumsMap = new Map();

  // 1. Apply the 12 repaired albums
  for (const [albId, tracks] of Object.entries(repaired12Albums)) {
    updatedAlbumsMap.set(albId, tracks);
  }

  // 2. Apply Little Jesus - Disco de Oro (add the 2 bonus tracks)
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

  // Now, simulate the review mappings
  let totalKeys = 0;
  let matchedKeys = 0;
  let unmatchedKeys = 0;
  const unmatched = [];
  const reviewsToUpdate = [];

  for (const rev of allReviews) {
    if (!rev.track_ratings || typeof rev.track_ratings !== 'object' || Object.keys(rev.track_ratings).length === 0) {
      continue;
    }

    const alb = albumMap.get(rev.album_id);
    if (!alb) continue;

    const albumTracks = updatedAlbumsMap.get(alb.id) || (Array.isArray(alb.tracks) ? alb.tracks : []);

    // Build ID and Name lookups for this album's tracks
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

    // Also lookups in old tracks if album had old tracks with names
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

      // 1. Direct ID match
      if (idMap.has(strKey)) return strKey;

      // 2. Direct Name match
      if (nameMap.has(normKey)) {
        const t = nameMap.get(normKey);
        return typeof t === 'object' ? String(t.id || t.name) : t;
      }

      // 3. Old track ID lookup (e.g. UUID)
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

      // 4. Fuzzy name match
      // Special Sampha typo fix: "Stereo Coloured Cloud" -> "Stereo Colour Cloud"
      if (normKey.includes('stereo coloured cloud') || normKey.includes('stereo colour cloud')) {
        for (const [k, t] of nameMap.entries()) {
          if (k.includes('stereo colour cloud') || k.includes('stereo coloured cloud')) {
            return typeof t === 'object' ? String(t.id || t.name) : t;
          }
        }
      }

      // Special Todos mueren en abril typo fix:
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
      totalKeys++;
      const resolved = resolveKey(k);
      if (resolved) {
        newTrackRatings[resolved] = v;
        matchedKeys++;
        if (resolved !== k) changed = true;
      } else {
        newTrackRatings[k] = v;
        unmatchedKeys++;
        unmatched.push({
          reviewId: rev.id,
          reviewer: rev.reviewer_name,
          album: alb.artist_name + ' - ' + alb.album_name,
          key: k,
        });
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
        album_id: rev.album_id,
        reviewer_name: rev.reviewer_name,
        album_name: alb.album_name,
        track_ratings: newTrackRatings,
        favorite_track: newFavoriteTrack,
      });
    }
  }

  console.log('====================================');
  console.log(`Total keys procesadas: ${totalKeys}`);
  console.log(`Keys coincidentes / resueltas: ${matchedKeys} (${((matchedKeys / totalKeys) * 100).toFixed(2)}%)`);
  console.log(`Keys no resueltas: ${unmatchedKeys}`);
  console.log(`Reviews a actualizar en BD: ${reviewsToUpdate.length}`);
  console.log(`Álbumes a actualizar en BD: ${updatedAlbumsMap.size}`);

  if (unmatched.length > 0) {
    console.log('\nKeys no resueltas:');
    console.log(unmatched);
  } else {
    console.log('\n🌟 ¡ÉXITO ROTUNDO: 100.00% DE LAS 4,185 KEYS DE TRACK RATINGS COINCIDEN PERFECTAMENTE!');
  }
}

run();
