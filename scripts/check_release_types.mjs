// scripts/check_release_types.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://nzsuxrycbywbdyidvsfl.supabase.co', 'sb_publishable_8CYM-sB7DY1_cyw8Amyr9g_-JtuZEKO');

async function check() {
  const { data: albums } = await supabase
    .from('albums')
    .select('id, album_name, artist_name, release_type, total_tracks, mbid')
    .order('album_name');

  console.log('Albums that might need refinement:');
  albums.forEach((a) => {
    const title = a.album_name.toLowerCase();
    const isShort = (a.total_tracks && a.total_tracks <= 6);
    if (
      title.includes('ep') ||
      title.includes('single') ||
      title.includes('sencillo') ||
      title.includes('remix') ||
      title.includes('live') ||
      title.includes('en vivo') ||
      title.includes('soundtrack') ||
      title.includes('ost') ||
      title.includes('compil') ||
      title.includes('b-sides') ||
      title.includes('b-side')
    ) {
      console.log(`- "${a.album_name}" by "${a.artist_name}" -> Current: ${a.release_type} (Tracks: ${a.total_tracks})`);
    } else if (isShort && a.release_type === 'ALBUM') {
      console.log(`- [Short <=6 tracks] "${a.album_name}" by "${a.artist_name}" -> Current: ${a.release_type} (Tracks: ${a.total_tracks})`);
    }
  });
}

check();
