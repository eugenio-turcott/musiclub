// scripts/enrichAlbumsMusicBrainz.mjs
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

const USER_AGENT = 'MusiclubApp/1.0 ( https://musiclub.app ; contact@musiclub.app )';
const COVER_ART_BASE = 'https://coverartarchive.org';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

    // Title match
    if (title === cleanAlb) {
      score += 45;
    } else if (title.includes(cleanAlb) || cleanAlb.includes(title)) {
      score += 20;
    }

    // Artist match
    if (rgArt === cleanArt) {
      score += 35;
    } else if (rgArt.includes(cleanArt) || cleanArt.includes(rgArt)) {
      score += 20;
    }

    // Format preference
    if (primary === 'album' && secondary.length === 0) {
      score += 30; // Pure studio album
    } else if (primary === 'album') {
      score += 15;
    } else if (primary === 'ep') {
      score += 25;
    } else if (primary === 'single') {
      score += 5;
    }

    // Penalize secondary types if not requested in query
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

  try {
    // 1. Intento con query estructurada exacta
    const query = `artist:"${cleanArtist}" AND releasegroup:"${cleanAlbum}"`;
    const url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(query)}&limit=10&fmt=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) {
      const data = await res.json();
      const rgs = data['release-groups'] || [];
      const best = pickBestReleaseGroup(rgs, cleanArtist, cleanAlbum);
      if (best) return best;
    }

    await sleep(600);

    // 2. Intento con búsqueda libre
    const freeUrl = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(cleanArtist + ' ' + cleanAlbum)}&limit=10&fmt=json`;
    const freeRes = await fetch(freeUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (freeRes.ok) {
      const data = await freeRes.json();
      const rgs = data['release-groups'] || [];
      const best = pickBestReleaseGroup(rgs, cleanArtist, cleanAlbum);
      if (best) return best;
    }

    // 3. Intento simplificando paréntesis / deluxe / remixes
    const simplifiedAlbum = cleanAlbum.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
    if (simplifiedAlbum && simplifiedAlbum !== cleanAlbum) {
      await sleep(600);
      const simpUrl = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(cleanArtist + ' ' + simplifiedAlbum)}&limit=10&fmt=json`;
      const simpRes = await fetch(simpUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (simpRes.ok) {
        const data = await simpRes.json();
        const rgs = data['release-groups'] || [];
        const best = pickBestReleaseGroup(rgs, cleanArtist, simplifiedAlbum);
        if (best) return best;
      }
    }
  } catch (err) {
    console.error(`Error buscando "${cleanArtist} - ${cleanAlbum}" en MB:`, err.message);
  }
  return null;
}

async function getReleaseGroupInfo(mbid) {
  try {
    const url = `https://musicbrainz.org/ws/2/release-group/${mbid}?inc=releases+artists+tags&fmt=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Error obteniendo release-group ${mbid}:`, err.message);
    return null;
  }
}

async function getReleaseDetails(releaseId) {
  try {
    const url = `https://musicbrainz.org/ws/2/release/${releaseId}?inc=labels+recordings+url-rels&fmt=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Error obteniendo release ${releaseId}:`, err.message);
    return null;
  }
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

async function enrichAllAlbums() {
  console.log('🚀 Iniciando enriquecimiento canónico de la tabla de álbumes...\n');

  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error al consultar Supabase:', error.message);
    return;
  }

  console.log(`📦 Se encontraron ${albums.length} álbumes en la base de datos.\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < albums.length; i++) {
    const album = albums[i];
    const indexStr = `[${i + 1}/${albums.length}]`;
    console.log(`\n${indexStr} Procesando: "${album.album_name}" de "${album.artist_name}" (ID: ${album.id})...`);

    try {
      // 1. Buscar en MusicBrainz
      const rg = await searchMusicBrainz(album.artist_name, album.album_name);
      await sleep(1000);

      let mbid = album.mbid;
      let releaseType = album.release_type || 'ALBUM';
      let firstReleaseDate = album.release_date;
      let releaseYear = album.release_year;
      let genres = Array.isArray(album.genres) ? album.genres : [];
      let label = album.label || null;
      let country = album.country || null;
      let barcode = album.barcode || null;
      let totalTracks = album.total_tracks || null;
      let tracks = album.tracks || [];
      let directStreamingLinks = {
        spotify: null,
        youtube: null,
        appleMusic: null,
      };

      if (rg) {
        mbid = rg.id;
        releaseType = normalizeReleaseType(rg['primary-type'], rg['secondary-types']);
        
        if (rg['first-release-date']) {
          firstReleaseDate = rg['first-release-date'];
          const y = parseInt(firstReleaseDate.substring(0, 4), 10);
          if (!isNaN(y) && y >= 1900 && y <= 2100) {
            releaseYear = y;
          }
        }

        // 2. Obtener detalles del release group y releases
        const rgDetails = await getReleaseGroupInfo(mbid);
        await sleep(1000);

        if (rgDetails) {
          const tags = (rgDetails.tags || []).map((t) => t.name).slice(0, 5);
          if (tags.length > 0) {
            genres = tags;
          }

          const releases = rgDetails.releases || [];
          if (releases.length > 0) {
            // Seleccionar el release más representativo (oficial o con fecha)
            const bestRelBasic = releases.find((r) => r.status === 'Official' && r.country) || releases[0];
            country = bestRelBasic.country || country;
            barcode = bestRelBasic.barcode || barcode;
            if (bestRelBasic.date && !firstReleaseDate) {
              firstReleaseDate = bestRelBasic.date;
            }

            // Consultar release completo para tracklist y labels
            const relFull = await getReleaseDetails(bestRelBasic.id);
            await sleep(1000);

            if (relFull) {
              country = relFull.country || country;
              barcode = relFull.barcode || barcode;

              const labelsList = (relFull['label-info'] || [])
                .map((l) => l.label?.name)
                .filter(Boolean);
              if (labelsList.length > 0) {
                label = labelsList[0];
              }

              // Relaciones de streaming
              (relFull.relations || []).forEach((rel) => {
                const relUrl = rel.url?.resource || '';
                if (relUrl.includes('spotify.com/album/')) directStreamingLinks.spotify = relUrl;
                if (relUrl.includes('youtube.com') || relUrl.includes('music.youtube.com')) directStreamingLinks.youtube = relUrl;
                if (relUrl.includes('music.apple.com')) directStreamingLinks.appleMusic = relUrl;
              });

              // Tracks oficiales
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
                // Si no había tracks o los de MusicBrainz son más completos
                if (!tracks || tracks.length === 0 || tracks.length < parsedTracks.length) {
                  tracks = parsedTracks;
                }
              }
            }
          }
        }
      } else {
        console.log(`  ℹ️ No se encontró coincidencia directa en MusicBrainz. Se completarán enlaces y release_type.`);
      }

      // Si no tenemos releaseYear calculado aún
      if (!releaseYear && firstReleaseDate) {
        const y = parseInt(String(firstReleaseDate).substring(0, 4), 10);
        if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
      }

      // 3. Resolver Portada (Cover Art Archive o mantener la actual)
      let imageUrl = album.image_url;
      if (mbid) {
        const hasCaa = await checkCoverArtExists(mbid);
        await sleep(300);
        if (hasCaa) {
          imageUrl = `${COVER_ART_BASE}/release-group/${mbid}/front-500`;
        }
      }

      // 4. Resolver Streaming Links Funcionales
      let spotifyLink = album.spotify_link || directStreamingLinks.spotify;
      if (!spotifyLink && album.link && album.link.includes('spotify.com')) {
        spotifyLink = album.link;
      }
      if (!spotifyLink) {
        spotifyLink = `https://open.spotify.com/search/${encodeURIComponent(album.artist_name + ' ' + album.album_name)}`;
      }

      let youtubeLink = album.youtube_link || directStreamingLinks.youtube;
      if (!youtubeLink && album.link && album.link.includes('youtube.com')) {
        youtubeLink = album.link;
      }
      if (!youtubeLink) {
        youtubeLink = `https://music.youtube.com/search?q=${encodeURIComponent(album.artist_name + ' ' + album.album_name)}`;
      }

      let appleMusicLink = album.apple_music_link || directStreamingLinks.appleMusic;
      if (!appleMusicLink && album.link && album.link.includes('apple.com')) {
        appleMusicLink = album.link;
      }
      if (!appleMusicLink) {
        appleMusicLink = `https://music.apple.com/search?term=${encodeURIComponent(album.artist_name + ' ' + album.album_name)}`;
      }

      // 5. Actualizar en Supabase
      const updatePayload = {
        mbid: mbid || null,
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
        spotify_link: spotifyLink,
        youtube_link: youtubeLink,
        apple_music_link: appleMusicLink,
      };

      const { error: updateError } = await supabase
        .from('albums')
        .update(updatePayload)
        .eq('id', album.id);

      if (updateError) {
        console.error(`  ❌ Error actualizando álbum "${album.album_name}":`, updateError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Actualizado con éxito:`);
        console.log(`     • MBID: ${mbid || 'N/A'}`);
        console.log(`     • Tipo: ${releaseType}`);
        console.log(`     • Año: ${releaseYear || 'N/A'} (${firstReleaseDate || 'N/A'})`);
        console.log(`     • Sello: ${label || 'N/A'} | País: ${country || 'N/A'}`);
        console.log(`     • Tracks: ${totalTracks || (tracks ? tracks.length : 0)}`);
        console.log(`     • Spotify: ${spotifyLink ? 'OK' : 'No'} | YT: ${youtubeLink ? 'OK' : 'No'} | Apple: ${appleMusicLink ? 'OK' : 'No'}`);
        updatedCount++;
      }
    } catch (itemErr) {
      console.error(`  ❌ Error procesando álbum "${album.album_name}":`, itemErr.message);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('🎉 RESUMEN DE ENRIQUECIMIENTO MASIVO');
  console.log(`Total álbumes en BD:  ${albums.length}`);
  console.log(`Actualizados:         ${updatedCount}`);
  console.log(`Omitidos / Sin MB:    ${skippedCount}`);
  console.log(`Errores:              ${errorCount}`);
  console.log('========================================\n');
}

enrichAllAlbums().catch((err) => {
  console.error('Fatal error en enrichAllAlbums:', err);
});
