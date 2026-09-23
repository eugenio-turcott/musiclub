// src/utils/genreNormalizer.js

/**
 * Normalizador Oficial de Géneros Musicales para Musiclub.
 * Transforma etiquetas de diversas fuentes (Record Club, Spotify, MusicBrainz, Deezer)
 * en 1 a 3 géneros musicales canónicos, concisos y profesionales en Title Case.
 */

export const CANONICAL_GENRES = new Set([
  // Rock & derivados
  'Rock', 'Rock Alternativo', 'Indie Rock', 'Hard Rock', 'Garage Rock',
  'Rock Psicodélico', 'Art Rock', 'Grunge', 'Post-Punk', 'Punk', 'Pop-Punk',
  'Emo', 'Shoegaze', 'Dream Pop', 'Post-Rock', 'Surf Rock', 'Rock Progresivo',
  'Blues', 'Blues Rock',

  // Pop
  'Pop', 'Synth-Pop', 'Dance-Pop', 'Electropop', 'Art Pop', 'Hyperpop',
  'Indie Pop', 'Pop Rock', 'K-Pop', 'J-Pop', 'Pop Latino',

  // Hip-Hop & Rap
  'Hip-Hop', 'Rap', 'Trap', 'Trap Latino', 'Boom Bap', 'Hip-Hop Alternativo',

  // R&B, Soul & Funk
  'R&B', 'Soul', 'Neo-Soul', 'Funk', 'Disco',

  // Electrónica
  'Electrónica', 'House', 'Deep House', 'Techno', 'Ambient', 'IDM',
  'Drum and Bass', 'Synthwave', 'UK Garage', 'Trance', 'Downtempo',
  'Trip-Hop', 'Dark Wave', 'Industrial',

  // Latino & Urbano
  'Latino', 'Reggaetón', 'Urbano', 'Regional Mexicano', 'Corrido',
  'Flamenco', 'Cumbia', 'Salsa', 'Bossa Nova', 'Bolero', 'Balada',

  // Metal
  'Metal', 'Metal Alternativo', 'Heavy Metal', 'Nu Metal', 'Metalcore',
  'Death Metal', 'Black Metal', 'Sludge Metal', 'Thrash Metal',

  // Jazz
  'Jazz', 'Bop', 'Jazz Fusión',

  // Folk & Acústico
  'Folk', 'Indie Folk', 'Cantautor', 'Country', 'Americana',

  // Clásica & Otros
  'Clásica', 'New Wave', 'Lo-Fi', 'Alternativo', 'Indie', 'Árabe'
]);

const NOISE_TAGS = new Set([
  'wochen', '5+ wochen', '1–4 wochen', 'laut.de', 'plattentests.de', 'offizielle charts',
  'charts', 'discogs', 'english', 'spanish', 'album', 'single', 'ep', 'deluxe', 'edition',
  'vinyl', 'cd', 'lp', 'remaster', 'remastered', 'bonus', 'track', 'reissue', 'promotional',
  'deutsch', 'french', 'japanese', 'uk', 'us', 'usa', 'de', 'music', 'songs', 'rhythmic',
  'allmusic', 'pitchfork', 'rolling stone', 'soundtrack', 'original soundtrack', 'ost',
  'release', 'various artists', 'unknown', 'ph_temp_checken', 'fixme', '70s', '80s', '90s', '00s'
]);

const CANONICAL_MAP = [
  // Metal & Heavy
  { patterns: [/metalcore/i], canonical: 'Metalcore' },
  { patterns: [/alternative metal/i, /nu metal/i, /nu-metal/i], canonical: 'Metal Alternativo' },
  { patterns: [/heavy metal/i, /thrash metal/i, /death metal/i, /black metal/i, /sludge metal/i, /doom metal/i, /metal/i], canonical: 'Metal' },

  // Punk & Post-Punk
  { patterns: [/post-punk/i, /post punk/i], canonical: 'Post-Punk' },
  { patterns: [/pop-punk/i, /pop punk/i, /punk rock/i, /punk/i, /hardcore/i], canonical: 'Punk' },

  // Shoegaze & Dream Pop
  { patterns: [/shoegaze/i, /noise pop/i], canonical: 'Shoegaze' },
  { patterns: [/dream pop/i, /dreampop/i], canonical: 'Dream Pop' },

  // Rock & Indie
  { patterns: [/indie rock/i, /indie-rock/i], canonical: 'Indie Rock' },
  { patterns: [/alternative rock/i, /alt-rock/i, /alt rock/i, /grunge/i], canonical: 'Rock Alternativo' },
  { patterns: [/garage rock/i, /art rock/i, /psychedelic rock/i, /classic rock/i, /hard rock/i, /rock & roll/i, /rock y roll/i, /rock/i], canonical: 'Rock' },

  // Hip-Hop & Rap
  { patterns: [/trap latino/i, /latin trap/i], canonical: 'Trap Latino' },
  { patterns: [/trap/i], canonical: 'Trap' },
  { patterns: [/boom bap/i, /conscious hip hop/i, /gangsta rap/i, /cloud rap/i], canonical: 'Hip-Hop' },
  { patterns: [/hip hop/i, /hip-hop/i, /rap/i, /rap\/hip hop/i], canonical: 'Hip-Hop' },

  // R&B, Soul & Funk
  { patterns: [/contemporary r&b/i, /alternative r&b/i, /r&b/i, /rhythm and blues/i], canonical: 'R&B' },
  { patterns: [/neo-soul/i, /neo soul/i, /soul/i], canonical: 'Soul' },
  { patterns: [/funk/i, /disco/i], canonical: 'Funk' },

  // Electronic & Club
  { patterns: [/synth-pop/i, /synthpop/i, /electropop/i, /hyperpop/i], canonical: 'Synth-Pop' },
  { patterns: [/ambient/i, /downtempo/i, /drone/i], canonical: 'Ambient' },
  { patterns: [/techno/i], canonical: 'Techno' },
  { patterns: [/house/i, /deep house/i, /tech house/i], canonical: 'House' },
  { patterns: [/uk garage/i, /drum and bass/i, /idm/i, /electronic/i, /electronica/i, /electrónica/i, /dance/i, /edm/i], canonical: 'Electrónica' },

  // Latin & Urban
  { patterns: [/reggaeton/i, /reggaetón/i], canonical: 'Reggaetón' },
  { patterns: [/corrido/i, /sierreño/i, /regional mexicano/i, /musica mexicana/i], canonical: 'Regional Mexicano' },
  { patterns: [/flamenco/i, /bulería/i], canonical: 'Flamenco' },
  { patterns: [/latin pop/i, /pop latino/i], canonical: 'Pop Latino' },
  { patterns: [/latin/i, /latino/i, /urbano/i, /latin urban/i, /música latina/i], canonical: 'Latino' },

  // Pop
  { patterns: [/dance-pop/i, /dance pop/i], canonical: 'Dance-Pop' },
  { patterns: [/indie pop/i, /indie-pop/i], canonical: 'Indie Pop' },
  { patterns: [/art pop/i, /chamber pop/i], canonical: 'Art Pop' },
  { patterns: [/k-pop/i, /kpop/i], canonical: 'K-Pop' },
  { patterns: [/j-pop/i, /jpop/i], canonical: 'J-Pop' },
  { patterns: [/pop rock/i, /pop\/rock/i], canonical: 'Pop Rock' },
  { patterns: [/pop/i], canonical: 'Pop' },

  // Folk, Country & Acoustic
  { patterns: [/indie folk/i, /folk rock/i, /folk/i], canonical: 'Folk' },
  { patterns: [/singer-songwriter/i, /cantautor/i, /trova/i], canonical: 'Cantautor' },
  { patterns: [/country/i, /americana/i, /bluegrass/i], canonical: 'Country' },

  // Jazz & Classical
  { patterns: [/bossa nova/i], canonical: 'Bossa Nova' },
  { patterns: [/jazz/i, /bop/i, /fusion/i], canonical: 'Jazz' },
  { patterns: [/classical/i, /clásica/i, /orchestral/i], canonical: 'Clásica' },

  // Indie & Alternative generic
  { patterns: [/indie/i], canonical: 'Indie' },
  { patterns: [/alternativo/i, /alternative/i], canonical: 'Alternativo' },
];

/**
 * Limpia y normaliza una lista cruda de géneros a un máximo de 1 a 3 géneros canónicos.
 * @param {Array<string>} rawList
 * @param {number} max Limite de géneros (por defecto 3)
 * @returns {Array<string>}
 */
export function normalizeCanonicalGenres(rawList = [], max = 3) {
  if (!Array.isArray(rawList)) return ['Alternativo'];

  const result = [];
  const seen = new Set();

  for (const raw of rawList) {
    if (!raw || typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();

    if (trimmed.length < 2 || trimmed.length > 30) continue;
    if (NOISE_TAGS.has(lower)) continue;

    let isNoise = false;
    for (const n of NOISE_TAGS) {
      if (lower.includes(n)) {
        isNoise = true;
        break;
      }
    }
    if (isNoise) continue;

    let matched = null;
    for (const entry of CANONICAL_MAP) {
      if (entry.patterns.some((p) => p.test(trimmed))) {
        matched = entry.canonical;
        break;
      }
    }

    if (!matched) {
      for (const cg of CANONICAL_GENRES) {
        if (cg.toLowerCase() === lower) {
          matched = cg;
          break;
        }
      }
    }

    if (matched && !seen.has(matched.toLowerCase())) {
      seen.add(matched.toLowerCase());
      result.push(matched);
      if (result.length >= max) break;
    }
  }

  return result.length > 0 ? result : ['Alternativo'];
}
