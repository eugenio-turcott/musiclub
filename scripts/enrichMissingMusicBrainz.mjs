// scripts/enrichMissingMusicBrainz.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://nzsuxrycbywbdyidvsfl.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_8CYM-sB7DY1_cyw8Amyr9g_-JtuZEKO';
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_AGENT = 'Musiclub/2.0 ( contact@musiclub.app ; https://musiclub.app )';
const COVER_ART_BASE = 'https://coverartarchive.org';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.status === 503 || res.status === 429) {
        const delay = attempt * 2500;
        console.log(`    ⚠️ Throttled (HTTP ${res.status}), esperando ${delay}ms... (intento ${attempt}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      if (!res.ok) {
        return null;
      }
      return await res.json();
    } catch (err) {
      console.log(`    ⚠️ Error de red: ${err.message}, reintentando...`);
      await sleep(attempt * 2000);
    }
  }
  return null;
}

export function normalizeReleaseType(primaryType, secondaryTypes = []) {
  const p = (primaryType || '').toLowerCase();
  const s = (secondaryTypes || []).map((t) => (t || '').toLowerCase());

  if (s.includes('compilation')) return 'COMPILACION';
  if (s.includes('soundtrack')) return 'SOUNDTRACK';
  if (s.includes('live')) return 'EN VIVO';
  if (s.includes('remix')) return 'REMIX';

  if (p === 'ep') return 'EP';
  if (p === 'single') return 'SENCILLO';
  if (p === 'album') return 'ALBUM';
  return 'ALBUM';
}

function cleanSearchTerm(str) {
  if (!str) return '';
  return str
    .replace(/[“”"']/g, '')
    .trim();
}

function pickBestReleaseGroup(rgs, artist, album) {
  if (!rgs || rgs.length === 0) return null;
  const cleanAlb = album.toLowerCase().trim();
  const cleanArt = artist.toLowerCase().trim();

  const scored = rgs.map((rg) => {
    let score = rg.score || 50;
    const title = (rg.title || '').toLowerCase().trim();
    const rgArt = (rg['artist-credit'] || [])
      .map((a) => (typeof a === 'string' ? a : a.name || a.artist?.name || ''))
      .join('')
      .toLowerCase()
      .trim();

    const primary = (rg['primary-type'] || '').toLowerCase();
    const secondary = (rg['secondary-types'] || []).map((s) => s.toLowerCase());

    // Title matching
    if (title === cleanAlb) {
      score += 45;
    } else if (title.includes(cleanAlb) || cleanAlb.includes(title)) {
      score += 20;
    }

    // Artist matching
    if (rgArt === cleanArt) {
      score += 35;
    } else if (rgArt.includes(cleanArt) || cleanArt.includes(rgArt)) {
      score += 20;
    }

    // Format preference
    if (primary === 'album' && secondary.length === 0) {
      score += 30;
    } else if (primary === 'album') {
      score += 15;
    } else if (primary === 'ep') {
      score += 25;
    } else if (primary === 'single') {
      score += 5;
    }

    if (secondary.includes('compilation') && !cleanAlb.includes('compil')) {
      score -= 25;
    }
    if (secondary.includes('live') && !cleanAlb.includes('live') && !cleanAlb.includes('vivo')) {
      score -= 25;
    }
    if (secondary.includes('demo')) {
      score -= 30;
    }
    if (secondary.includes('remix') && !cleanAlb.includes('remix')) {
      score -= 20;
    }

    return { rg, calculatedScore: score };
  });

  scored.sort((a, b) => b.calculatedScore - a.calculatedScore);
  return scored[0]?.rg || null;
}

async function searchMusicBrainz(artistName, albumName) {
  const cleanArtist = cleanSearchTerm(artistName);
  const cleanAlbum = cleanSearchTerm(albumName);

  // 1. Structured query
  const query = `artist:"${cleanArtist}" AND releasegroup:"${cleanAlbum}"`;
  let url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(query)}&limit=10&fmt=json`;
  let data = await fetchWithRetry(url);
  if (data) {
    const rgs = data['release-groups'] || [];
    const best = pickBestReleaseGroup(rgs, cleanArtist, cleanAlbum);
    if (best) return best;
  }

  await sleep(1500);

  // 2. Free search query
  const freeQuery = `${cleanArtist} ${cleanAlbum}`;
  url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(freeQuery)}&limit=10&fmt=json`;
  data = await fetchWithRetry(url);
  if (data) {
    const rgs = data['release-groups'] || [];
    const best = pickBestReleaseGroup(rgs, cleanArtist, cleanAlbum);
    if (best) return best;
  }

  // 3. Simplified name (removing parenthesis)
  const simplifiedAlbum = cleanAlbum.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  if (simplifiedAlbum && simplifiedAlbum !== cleanAlbum) {
    await sleep(1500);
    const simpQuery = `${cleanArtist} ${simplifiedAlbum}`;
    url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(simpQuery)}&limit=10&fmt=json`;
    data = await fetchWithRetry(url);
    if (data) {
      const rgs = data['release-groups'] || [];
      const best = pickBestReleaseGroup(rgs, cleanArtist, simplifiedAlbum);
      if (best) return best;
    }
  }

  return null;
}

async function checkCoverArtExists(mbid) {
  try {
    const url = `${COVER_ART_BASE}/release-group/${mbid}/front-500`;
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT } });
    return res.ok || res.status === 307 || res.status === 302;
  } catch {
    return false;
  }
}

async function enrichMissing() {
  console.log('🔍 Buscando álbumes sin MBID en Supabase...\n');

  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .is('mbid', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error consultando Supabase:', error.message);
    return;
  }

  console.log(`📦 Encontrados ${albums.length} álbumes pendientes por enriquecer.\n`);

  for (let i = 0; i < albums.length; i++) {
    const album = albums[i];
    const indexStr = `[${i + 1}/${albums.length}]`;
    console.log(`\n${indexStr} Procesando: "${album.album_name}" de "${album.artist_name}"...`);

    const rg = await searchMusicBrainz(album.artist_name, album.album_name);
    await sleep(1500);

    if (rg) {
      const mbid = rg.id;
      const releaseType = normalizeReleaseType(rg['primary-type'], rg['secondary-types']);
      let firstReleaseDate = album.release_date;
      let releaseYear = album.release_year;

      if (rg['first-release-date']) {
        firstReleaseDate = rg['first-release-date'];
        const y = parseInt(firstReleaseDate.substring(0, 4), 10);
        if (!isNaN(y) && y >= 1900 && y <= 2100) {
          releaseYear = y;
        }
      }

      // Check CAA image
      let imageUrl = album.image_url;
      const hasCaa = await checkCoverArtExists(mbid);
      await sleep(300);
      if (hasCaa) {
        imageUrl = `${COVER_ART_BASE}/release-group/${mbid}/front-500`;
      }

      // Get release-group details
      let genres = Array.isArray(album.genres) ? album.genres : [];
      let label = album.label || null;
      let country = album.country || null;
      let barcode = album.barcode || null;
      let totalTracks = album.total_tracks || null;
      let tracks = album.tracks || [];

      const rgDetailsUrl = `https://musicbrainz.org/ws/2/release-group/${mbid}?inc=releases+tags&fmt=json`;
      const rgDetails = await fetchWithRetry(rgDetailsUrl);
      await sleep(1500);

      if (rgDetails) {
        const tags = (rgDetails.tags || []).map((t) => t.name).slice(0, 5);
        if (tags.length > 0) genres = tags;

        const releases = rgDetails.releases || [];
        if (releases.length > 0) {
          const bestRel = releases.find((r) => r.status === 'Official' && r.country) || releases[0];
          country = bestRel.country || country;
          barcode = bestRel.barcode || barcode;
          if (bestRel.date && !firstReleaseDate) firstReleaseDate = bestRel.date;

          const relDetailsUrl = `https://musicbrainz.org/ws/2/release/${bestRel.id}?inc=labels+recordings&fmt=json`;
          const relFull = await fetchWithRetry(relDetailsUrl);
          await sleep(1500);

          if (relFull) {
            country = relFull.country || country;
            barcode = relFull.barcode || barcode;

            const labelsList = (relFull['label-info'] || [])
              .map((l) => l.label?.name)
              .filter(Boolean);
            if (labelsList.length > 0) label = labelsList[0];

            const parsedTracks = [];
            let count = 0;
            (relFull.media || []).forEach((media, discIdx) => {
              (media.tracks || []).forEach((t, trackIdx) => {
                count++;
                parsedTracks.push({
                  id: t.id || t.recording?.id || `mb-t-${count}`,
                  name: t.title || t.recording?.title || `Pista ${count}`,
                  track_number: t.position || trackIdx + 1,
                  duration_ms: t.length || 0,
                  disc_number: media.position || discIdx + 1,
                });
              });
            });

            if (parsedTracks.length > 0) {
              totalTracks = count;
              if (!tracks || tracks.length === 0 || tracks.length < parsedTracks.length) {
                tracks = parsedTracks;
              }
            }
          }
        }
      }

      if (!releaseYear && firstReleaseDate) {
        const y = parseInt(String(firstReleaseDate).substring(0, 4), 10);
        if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
      }

      const updatePayload = {
        mbid: mbid,
        release_type: releaseType,
        release_date: firstReleaseDate || null,
        release_year: releaseYear || null,
        label: label,
        country: country,
        barcode: barcode,
        total_tracks: totalTracks || (tracks ? tracks.length : null),
        genres: genres,
        tracks: tracks || [],
        image_url: imageUrl,
      };

      const { error: updateError } = await supabase
        .from('albums')
        .update(updatePayload)
        .eq('id', album.id);

      if (updateError) {
        console.error(`  ❌ Error actualizando ${album.album_name}:`, updateError.message);
      } else {
        console.log(`  ✅ Enriquecido: MBID=${mbid} | Tipo=${releaseType} | Año=${releaseYear} | Tracks=${totalTracks || tracks.length}`);
      }
    } else {
      console.log(`  ℹ️ No encontrado en MusicBrainz, conservando datos actuales.`);
    }
  }

  console.log('\n✨ Proceso de enriquecimiento de pendientes completado.\n');
}

enrichMissing().catch(console.error);
