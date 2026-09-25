// scripts/parse_downloaded_spotify.mjs
import fs from 'fs';
import path from 'path';

const files = [
  { step: 207, name: 'LCD Soundsystem - This Is Happening', albumId: 'f59b5fc8-fb26-4702-baba-a0437d0f3646' },
  { step: 227, name: 'T3R Elemento - Our Wave Nuestra Ola', albumId: '179e38f9-2407-4482-bc2e-6365be3a5762' },
  { step: 229, name: 'Roy Borland - Fotografías de España', albumId: '32a461e7-b29d-4352-968b-c6e8a70bfaf6' },
  { step: 231, name: 'Gorillaz - G-Sides', albumId: '34640bb0-c4f1-48f5-b5e1-5c5271c27a45' },
  { step: 233, name: 'Car Seat Headrest - Twin Fantasy', albumId: '624ed022-347d-41ea-baa4-3fa12959bbdf' },
  { step: 235, name: 'Olivia Rodrigo - you seem pretty sad for a girl so in love', albumId: '81628c16-d175-439c-be57-705a972916dd' },
  { step: 237, name: 'Limp Bizkit - Chocolate Starfish', albumId: 'b021df3d-2ff9-416b-9f0b-f6dd4576ffe2' },
  { step: 239, name: 'CHAEYOUNG - LIL FANTASY vol.1', albumId: 'cb1f847f-0725-48c8-9969-d01094b5957e' },
  { step: 241, name: 'Slipknot - All Hope Is Gone', albumId: 'd4cd2130-d275-45bf-bcdd-3440e6de16b7' },
  { step: 243, name: 'Mi abuelo es un búho - Metamorfosis', albumId: 'd8ddd030-ce99-4c12-9306-650f14451248' },
  { step: 245, name: 'Three Days Grace - One-X', albumId: 'ef4239da-3b8c-418d-baff-c0f6b2e5cae6' },
  { step: 247, name: 'Kevis & Maykyy - ESTO NO ES EL ÁLBUM', albumId: 'ff5dc58b-09a9-415e-95f4-44109c903746' },
];

const basePath = 'C:/Users/eturc/.gemini/antigravity-cli/brain/6b184b64-3e1e-4cc4-9735-2d29adef9b91/.system_generated/steps';

const parsedResults = {};

for (const item of files) {
  const filePath = `${basePath}/${item.step}/content.md`;
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf-8');

  // Regex to extract music:song and music:song:track
  // <meta property="music:song" content="https://open.spotify.com/track/2cmRpmO04TLaKPzmAzySYZ"/>
  // <meta property="music:song:disc" content="1"/>
  // <meta property="music:song:track" content="1"/>
  const songRegex = /<meta (?:name|property)="music:song" content="https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)"\/>\s*<meta (?:name|property)="music:song:disc" content="(\d+)"\/>\s*<meta (?:name|property)="music:song:track" content="(\d+)"\/>/g;
  const songs = [];
  let m;
  while ((m = songRegex.exec(content)) !== null) {
    songs.push({
      id: m[1],
      disc: parseInt(m[2], 10),
      track_number: parseInt(m[3], 10),
    });
  }

  // Also extract track names from schema.org or HTML markup if available
  // Let's see if there is JSON-LD schema or next_data
  console.log(`\n================== ${item.name} ==================`);
  console.log(`Parsed songs from meta tags: ${songs.length}`);
  if (songs.length > 0) {
    console.log(`First song ID: ${songs[0].id}, Last song ID: ${songs[songs.length - 1].id}`);
  }

  parsedResults[item.albumId] = {
    name: item.name,
    albumId: item.albumId,
    songs,
  };
}

fs.writeFileSync('scripts/parsed_spotify_tracks.json', JSON.stringify(parsedResults, null, 2));
console.log('\nSaved parsed tracks to scripts/parsed_spotify_tracks.json');
