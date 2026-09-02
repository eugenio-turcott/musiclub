// scripts/test_score.mjs

const USER_AGENT = 'MusiclubApp/1.0 ( https://musiclub.app ; contact@musiclub.app )';

function pickBestMatch(rgs, artist, album) {
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
      score += 40;
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
      score += 20;
    } else if (primary === 'single') {
      score += 5;
    }

    // Penalize secondary types if not searched
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

async function searchAndScore(artist, album) {
  const cleanArt = artist.replace(/["']/g, '').trim();
  const cleanAlb = album.replace(/["']/g, '').trim();

  // Try structured query
  const query = `artist:"${cleanArt}" AND releasegroup:"${cleanAlb}"`;
  let url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(query)}&limit=10&fmt=json`;
  let res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  let data = await res.json();
  let rgs = data['release-groups'] || [];

  if (rgs.length === 0) {
    const freeQuery = `${cleanArt} ${cleanAlb}`;
    url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(freeQuery)}&limit=10&fmt=json`;
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    data = await res.json();
    rgs = data['release-groups'] || [];
  }

  const best = pickBestMatch(rgs, artist, album);
  console.log(`[TEST] ${artist} - ${album} => ${best?.title} | Primary: ${best?.['primary-type']} | Secondary: ${JSON.stringify(best?.['secondary-types'] || [])} | MBID: ${best?.id}`);
}

async function run() {
  await searchAndScore('Rochelle Jordan', 'Through The Wall');
  await new Promise(r => setTimeout(r, 1100));
  await searchAndScore('Todos mueren en abril', 'Todos mueren en abril');
  await new Promise(r => setTimeout(r, 1100));
  await searchAndScore('Ashe', 'Ashlyn');
  await new Promise(r => setTimeout(r, 1100));
  await searchAndScore('Black Country, New Road', 'Forever Howlong');
  await new Promise(r => setTimeout(r, 1100));
  await searchAndScore('Charli XCX', 'BRAT');
  await new Promise(r => setTimeout(r, 1100));
  await searchAndScore('Knocked Loose', "You Won't Go Before You're Supposed To");
}

run();

