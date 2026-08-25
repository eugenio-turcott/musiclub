const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
});

const SUPABASE_URL = env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = env.REACT_APP_SUPABASE_ANON_KEY;
const SPOTIFY_CLIENT_ID = env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = env.REACT_APP_SPOTIFY_CLIENT_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let spotifyToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < tokenExpiresAt) return spotifyToken;
  const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Spotify Auth Error: ${res.statusText}`);
  const data = await res.json();
  spotifyToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return spotifyToken;
}

function extractSpotifyAlbumId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/album[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

async function getReleaseDate(album) {
  const token = await getSpotifyToken();
  const albumId = extractSpotifyAlbumId(album.spotify_link);

  // 1. Try Spotify Link ID
  if (albumId) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.release_date) {
          const year = parseInt(String(data.release_date).substring(0, 4), 10);
          if (!isNaN(year)) return { release_date: data.release_date, release_year: year };
        }
      }
    } catch (e) {
      console.warn(`Error fetching by ID for ${album.album_name}:`, e.message);
    }
  }

  // 2. Search Spotify
  try {
    const query = album.artist_name
      ? `${album.album_name} artist:${album.artist_name}`
      : album.album_name;
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      const data = await res.json();
      const first = data.albums?.items?.[0];
      if (first && first.release_date) {
        const year = parseInt(String(first.release_date).substring(0, 4), 10);
        if (!isNaN(year)) return { release_date: first.release_date, release_year: year };
      }
    }
  } catch (e) {
    console.warn(`Error searching Spotify for ${album.album_name}:`, e.message);
  }

  return null;
}

async function run() {
  console.log('Fetching albums from Supabase...');
  const { data: albums, error } = await supabase.from('albums').select('id, album_name, artist_name, spotify_link, release_date, release_year');
  if (error) {
    console.error('Error fetching albums:', error);
    process.exit(1);
  }

  console.log(`Found ${albums.length} albums in database.`);
  let updatedCount = 0;

  for (let i = 0; i < albums.length; i++) {
    const alb = albums[i];
    process.stdout.write(`[${i + 1}/${albums.length}] ${alb.album_name} - ${alb.artist_name}... `);

    const info = await getReleaseDate(alb);
    if (info) {
      const { error: updateError } = await supabase
        .from('albums')
        .update({
          release_date: info.release_date,
          release_year: info.release_year,
        })
        .eq('id', alb.id);

      if (updateError) {
        console.log(`❌ Error updating DB: ${updateError.message}`);
      } else {
        console.log(`✅ ${info.release_date} (${info.release_year})`);
        updatedCount++;
      }
    } else {
      console.log('⚠️ Could not resolve release date from Spotify');
    }
  }

  console.log(`\nDone! Successfully updated ${updatedCount} / ${albums.length} albums with Spotify release years.`);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
