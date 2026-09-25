// scripts/build_12_albums_canonical_tracks.mjs
import fs from 'fs';
import { fetchDeezer } from '../src/services/deezerApi.js';

const parsedSpotify = JSON.parse(fs.readFileSync('scripts/parsed_spotify_tracks.json', 'utf-8'));

const albums = [
  { id: 'f59b5fc8-fb26-4702-baba-a0437d0f3646', query: 'LCD Soundsystem This Is Happening', expectedCount: 9 },
  { id: '179e38f9-2407-4482-bc2e-6365be3a5762', query: 'T3R Elemento Our Wave Nuestra Ola', expectedCount: 11 },
  { id: '32a461e7-b29d-4352-968b-c6e8a70bfaf6', query: 'Roy Borland Fotografias de Espana', expectedCount: 8 },
  { id: '34640bb0-c4f1-48f5-b5e1-5c5271c27a45', query: 'Gorillaz G-Sides', expectedCount: 10 },
  { id: '624ed022-347d-41ea-baa4-3fa12959bbdf', query: 'Car Seat Headrest Twin Fantasy', expectedCount: 10 },
  { id: '81628c16-d175-439c-be57-705a972916dd', query: 'Olivia Rodrigo', expectedCount: 13, manualQuery: true },
  { id: 'b021df3d-2ff9-416b-9f0b-f6dd4576ffe2', query: 'Limp Bizkit Chocolate Starfish And The Hot Dog Flavored Water', expectedCount: 15 },
  { id: 'cb1f847f-0725-48c8-9969-d01094b5957e', query: 'CHAEYOUNG LIL FANTASY vol.1', expectedCount: 9 },
  { id: 'd4cd2130-d275-45bf-bcdd-3440e6de16b7', query: 'Slipknot All Hope Is Gone', expectedCount: 15 },
  { id: 'd8ddd030-ce99-4c12-9306-650f14451248', query: 'Mi abuelo es un buho Metamorfosis', expectedCount: 1 },
  { id: 'ef4239da-3b8c-418d-baff-c0f6b2e5cae6', query: 'Three Days Grace One-X', expectedCount: 12 },
  { id: 'ff5dc58b-09a9-415e-95f4-44109c903746', query: 'Kevis Maykyy ESTO NO ES EL ALBUM', expectedCount: 7 },
];

async function run() {
  const finalAlbumTracks = {};

  for (const alb of albums) {
    console.log(`\nProcessing: ${alb.query}...`);
    const spData = parsedSpotify[alb.id];
    if (!spData || !spData.songs || spData.songs.length === 0) {
      console.error(`  No Spotify data for ${alb.id}`);
      continue;
    }
    const spotifySongs = spData.songs;
    console.log(`  Spotify songs count: ${spotifySongs.length}`);

    // Fetch tracks from Deezer
    let deezerTracks = [];
    try {
      const searchRes = await fetchDeezer(`/search/album?q=${encodeURIComponent(alb.query)}`);
      if (searchRes.data && searchRes.data.length > 0) {
        // Find best match matching expectedCount or closest
        let bestAlbum = searchRes.data[0];
        for (const cand of searchRes.data.slice(0, 5)) {
          if (cand.nb_tracks === alb.expectedCount) {
            bestAlbum = cand;
            break;
          }
        }
        const albDetails = await fetchDeezer(`/album/${bestAlbum.id}`);
        if (albDetails.tracks && albDetails.tracks.data) {
          deezerTracks = albDetails.tracks.data;
        }
      }
    } catch (err) {
      console.warn(`  Deezer search failed: ${err.message}`);
    }

    console.log(`  Deezer tracks count: ${deezerTracks.length}`);

    // If Deezer tracks count matches Spotify songs count, pair them!
    const tracks = [];
    for (let i = 0; i < spotifySongs.length; i++) {
      const sp = spotifySongs[i];
      const dz = deezerTracks[i];
      tracks.push({
        id: sp.id,
        name: dz ? dz.title : `Track ${sp.track_number}`,
        track_number: sp.track_number,
        duration_ms: dz ? dz.duration * 1000 : 0,
      });
    }

    console.log(`  Created ${tracks.length} tracks.`);
    console.log(`  First: [${tracks[0].id}] ${tracks[0].name}`);
    console.log(`  Last: [${tracks[tracks.length - 1].id}] ${tracks[tracks.length - 1].name}`);

    finalAlbumTracks[alb.id] = tracks;
  }

  fs.writeFileSync('scripts/12_albums_final_tracks.json', JSON.stringify(finalAlbumTracks, null, 2));
  console.log('\nAll done! Saved to scripts/12_albums_final_tracks.json');
}

run();
