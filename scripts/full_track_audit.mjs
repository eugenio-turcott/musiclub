import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Fetch all albums
  let allAlbums = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, album_name, artist_name, tracks, spotify_link, mbid')
      .range(from, from + 999);
    if (error) {
      console.error('Error fetching albums:', error);
      break;
    }
    allAlbums = allAlbums.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  // Fetch all reviews
  let allReviews = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, album_id, reviewer_name, track_ratings, favorite_track')
      .range(from, from + 999);
    if (error) {
      console.error('Error fetching reviews:', error);
      break;
    }
    allReviews = allReviews.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const albumMap = new Map();
  allAlbums.forEach((a) => albumMap.set(a.id, a));

  console.log(`Albums count: ${allAlbums.length}`);
  console.log(`Reviews count: ${allReviews.length}`);

  // Classify each review's track_ratings
  const reports = [];

  for (const rev of allReviews) {
    const tr = rev.track_ratings;
    if (!tr || typeof tr !== 'object' || Object.keys(tr).length === 0) {
      continue;
    }

    const alb = albumMap.get(rev.album_id);
    const keys = Object.keys(tr);

    let tracks = alb?.tracks;
    if (typeof tracks === 'string') {
      try { tracks = JSON.parse(tracks); } catch (e) { tracks = []; }
    }
    if (!Array.isArray(tracks)) tracks = [];

    // Classify review keys
    // Are they spotify IDs? (22 chars alphanumeric)
    // Are they UUIDs? (36 chars)
    // Are they track names? (string matching track names or text)
    // Are they numbers?
    let keyFormat = {
      spotifyId: 0,
      uuid: 0,
      number: 0,
      nameOrText: 0
    };

    keys.forEach(k => {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)) {
        keyFormat.uuid++;
      } else if (/^[a-zA-Z0-9]{22}$/.test(k)) {
        keyFormat.spotifyId++;
      } else if (/^\d+$/.test(k)) {
        keyFormat.number++;
      } else {
        keyFormat.nameOrText++;
      }
    });

    // Classify album track IDs
    let albumIdFormat = {
      spotifyId: 0,
      uuid: 0,
      number: 0,
      nameOrText: 0,
      missing: 0
    };
    tracks.forEach(t => {
      const tid = typeof t === 'object' ? (t.id || t.spotify_id) : null;
      if (!tid) albumIdFormat.missing++;
      else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tid)) albumIdFormat.uuid++;
      else if (/^[a-zA-Z0-9]{22}$/.test(tid)) albumIdFormat.spotifyId++;
      else if (/^\d+$/.test(tid)) albumIdFormat.number++;
      else albumIdFormat.nameOrText++;
    });

    // Check matches
    // 1. Direct key == track.id
    const trackIdMap = new Map();
    const trackNameMap = new Map();
    tracks.forEach((t, idx) => {
      const tid = typeof t === 'object' ? String(t.id || t.spotify_id || '') : '';
      const tname = typeof t === 'object' ? (t.name || '') : String(t);
      if (tid) trackIdMap.set(tid, t);
      if (tname) trackNameMap.set(tname.toLowerCase().trim(), t);
    });

    let directIdMatches = 0;
    let nameMatches = 0;
    let unmatched = [];

    keys.forEach(k => {
      const strK = String(k).trim();
      const lowerK = strK.toLowerCase();
      if (trackIdMap.has(strK)) {
        directIdMatches++;
      } else if (trackNameMap.has(lowerK)) {
        nameMatches++;
      } else {
        // try fuzzy or partial
        let found = false;
        for (const [tNameLower, t] of trackNameMap.entries()) {
          const base1 = tNameLower.split(' - ')[0].trim();
          const base2 = lowerK.split(' - ')[0].trim();
          if (base1.length > 2 && (base1 === base2 || tNameLower.includes(lowerK) || lowerK.includes(tNameLower))) {
            found = true;
            break;
          }
        }
        if (found) nameMatches++;
        else unmatched.push(k);
      }
    });

    reports.push({
      reviewId: rev.id,
      reviewer: rev.reviewer_name,
      albumId: rev.album_id,
      albumTitle: alb?.album_name || 'NOT FOUND',
      artist: alb?.artist_name || 'NOT FOUND',
      keysCount: keys.length,
      albumTracksCount: tracks.length,
      keyFormat,
      albumIdFormat,
      directIdMatches,
      nameMatches,
      unmatchedCount: unmatched.length,
      unmatchedKeys: unmatched,
      sampleReviewKeys: keys.slice(0, 3),
      favoriteTrack: rev.favorite_track
    });
  }

  console.log(`\nAudited ${reports.length} reviews with track_ratings.`);

  // Group by discrepancy type
  const perfectIdMatches = reports.filter(r => r.directIdMatches === r.keysCount);
  const perfectNameMatches = reports.filter(r => r.nameMatches === r.keysCount && r.directIdMatches === 0);
  const mixedMatches = reports.filter(r => r.directIdMatches > 0 && r.nameMatches > 0 && r.unmatchedCount === 0);
  const withUnmatched = reports.filter(r => r.unmatchedCount > 0);

  console.log(`\nSummary:`);
  console.log(`- Perfect ID matches: ${perfectIdMatches.length}`);
  console.log(`- Perfect Name matches (reviews use song name, album has IDs/names): ${perfectNameMatches.length}`);
  console.log(`- Mixed ID + Name matches: ${mixedMatches.length}`);
  console.log(`- With unmatched keys: ${withUnmatched.length}`);

  // Let's examine the withUnmatched reviews in detail
  console.log(`\n--- Unmatched Reviews (${withUnmatched.length}) ---`);
  withUnmatched.forEach(r => {
    console.log(`\nReview ${r.reviewId} | ${r.reviewer} | "${r.albumTitle}" - ${r.artist}`);
    console.log(`  Keys: ${r.keysCount}, AlbTracks: ${r.albumTracksCount}`);
    console.log(`  KeyFormat:`, JSON.stringify(r.keyFormat));
    console.log(`  AlbIdFormat:`, JSON.stringify(r.albumIdFormat));
    console.log(`  DirectIdMatches: ${r.directIdMatches}, NameMatches: ${r.nameMatches}, Unmatched: ${r.unmatchedCount}`);
    console.log(`  Unmatched keys:`, r.unmatchedKeys);
  });

  // Also let's check albums themselves: how many albums have Spotify IDs vs UUIDs vs no tracks
  let albStats = {
    spotifyIds: 0,
    uuids: 0,
    mixed: 0,
    noIds: 0,
    noTracks: 0
  };
  for (const alb of allAlbums) {
    let tracks = alb.tracks;
    if (typeof tracks === 'string') {
      try { tracks = JSON.parse(tracks); } catch (e) { tracks = []; }
    }
    if (!Array.isArray(tracks) || tracks.length === 0) {
      albStats.noTracks++;
      continue;
    }
    let hasSp = false, hasUuid = false, hasNone = false;
    for (const t of tracks) {
      const tid = typeof t === 'object' ? (t.id || t.spotify_id) : null;
      if (!tid) hasNone = true;
      else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tid)) hasUuid = true;
      else if (/^[a-zA-Z0-9]{22}$/.test(tid)) hasSp = true;
      else hasNone = true;
    }
    if (hasSp && hasUuid) albStats.mixed++;
    else if (hasSp) albStats.spotifyIds++;
    else if (hasUuid) albStats.uuids++;
    else albStats.noIds++;
  }
  console.log('\n--- Album Track ID Stats ---');
  console.log(albStats);
}

main().catch(console.error);
