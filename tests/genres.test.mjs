import test from 'node:test';
import assert from 'node:assert/strict';
import routes from '../src/utils/genreRoutes.cjs';
import sitemap from '../src/utils/sitemapData.cjs';
import visuals from '../src/utils/genreVisuals.cjs';
import symbols from '../src/utils/genreSymbols.cjs';
import fs from 'node:fs';
import genres from '../src/utils/genreCatalog.cjs';
import { normalizeCanonicalGenres } from '../src/utils/genreNormalizer.js';
import { planReleaseGenres } from '../scripts/lib/release-genres.mjs';
import emailArtwork from '../src/utils/genreEmailArtwork.cjs';
import sharp from 'sharp';
import { splitArtists, slugifyArtist } from '../src/utils/ratingUtils.js';
import { generatePoolWinnerHtml, generatePoolGraduatedHtml, generateUpcomingConfirmationHtml, generateUpcomingReleaseDayHtml, generateSongRecommendationHtml, prepareAttachmentsAndImages } from '../src/services/emailService.js';

test('email vinyl uses the first genre and embeds an actual PNG compatible with mail clients', async () => {
  const input = { albumName: 'Example', artistName: 'Example', genres: ['K-Pop', 'Pop'], imageUrl: '', breakdown: {} };
  for (const render of [generatePoolWinnerHtml, generatePoolGraduatedHtml, generateUpcomingConfirmationHtml, generateUpcomingReleaseDayHtml, generateSongRecommendationHtml]) {
    const html = render(input);
    assert.ok(html.includes('/genres/vinyl/v3/k-pop.png'));
    assert.ok(!html.includes('/genres/vinyl/v3/pop.png'));
    assert.ok(!html.includes('border-collapse: collapse'));
  }
  const prepared = await prepareAttachmentsAndImages({ genres: input.genres });
  const vinyl = prepared.attachments.find(file => file.cid === 'genre_vinyl');
  assert.equal(prepared.vinylUrl, 'cid:genre_vinyl');
  assert.equal((await sharp(vinyl.content).metadata()).format, 'png');
  assert.equal((await sharp(vinyl.content).metadata()).width, 560);
  assert.equal(emailArtwork.genreEmailSvg('Q12345'), null);
});

test('artist links preserve band names containing commas and symbol-only artists', () => {
  assert.deepEqual(splitArtists('Black Country, New Road'), [{ name: 'Black Country, New Road', slug: 'black-country-new-road' }]);
  assert.equal(slugifyArtist('@'), 'at-band');
});

test('genre normalization preserves specific styles and consolidates spelling and languages', () => {
  assert.deepEqual(normalizeCanonicalGenres(['hip-hop', 'Hip Hop', 'Rap', 'Black Metal', 'death metal', 'Metal Alternativo']), ['Hip-Hop', 'Black Metal', 'Death Metal', 'Metal Alternativo']);
  assert.deepEqual(normalizeCanonicalGenres(['Techno/House', '5+ wochen', 'Q12345', 'df2bacfa-8f55-4ffc-9323-fbee21698b59', {name:'qawwali'}]), ['Techno', 'House', 'Qawwali']);
  assert.deepEqual(normalizeCanonicalGenres([]), []);
  assert.equal(genres.genreKey('Electrónica'), 'electronic');
  assert.equal(genres.genreKey('electronica'), 'electronica');
});
test('migration checks identity and refuses an unresolved release before writing', () => {
  const row = { id: '1', album_name: 'Album', artist_name: 'Artist', genres: [] };
  assert.throws(() => planReleaseGenres([row], []), /Missing verified genre/);
  assert.throws(() => planReleaseGenres([row], [{...row, album_name:'Other', genres:['Jazz']}]), /identity changed/);
  const [plan] = planReleaseGenres([row], [{...row, genres:['Jazz','unknown123']}]);
  assert.deepEqual(plan.genres,['Jazz']);
  assert.equal(plan.changed,true);
  assert.equal(planReleaseGenres([{...row, genres:['Jazz']}],[])[0].changed,false);
});
test('every registered genre has a stable unique capsule and a readable label', () => {
  assert.ok(genres.GENRES.length >= 2215);
  const ids = new Set();
  for (const genre of genres.GENRES) {
    assert.equal(genres.genreKey(genre.id), genre.id);
    const capsule = genres.genreCapsule(genre.id);
    assert.deepEqual(capsule, genres.genreCapsule(genre.name));
    assert.equal(capsule.genre, genre.id);
    assert.ok(!ids.has(capsule.id)); ids.add(capsule.id);
    assert.ok(capsule.badge.length > 1);
  }
});
test('a genre filter never draws another genre and never substitutes an empty genre', () => {
  const albums = [{id:'a',genres:['Rock','Indie Rock']},{id:'b',genres:['Jazz']},{id:'c',genres:['rock']},{id:'d',genres:[]}];
  for (let index=0; index<100; index++) {
    const draw = genres.drawGenreCapsule(albums,'Rock',()=>index/100);
    assert.ok(['a','c'].includes(draw.album.id));
    assert.equal(draw.theme.genre,'rock');
    assert.ok(genres.albumGenreKeys(draw.album).includes(draw.theme.genre));
  }
  assert.equal(genres.drawGenreCapsule(albums,'qawwali'),null);
  assert.equal(genres.drawGenreCapsule([{id:'empty',genres:[]}]),null);
  for (let index=0;index<100;index++) {
    const draw=genres.drawGenreCapsule(albums,'all',()=>index/100);
    assert.ok(genres.albumGenreKeys(draw.album).includes(draw.theme.genre));
  }
});


test('genre pages preserve every identity, aliases and accents without URL collisions', () => {
  const paths = new Set();
  for (const genre of genres.GENRES) {
    const slug = routes.genreSlug(genre.id);
    assert.equal(routes.findGenreBySlug(slug)?.id, genre.id);
    assert.ok(!paths.has(routes.genrePath(genre.id)), genre.id);
    paths.add(routes.genrePath(genre.id));
  }
  assert.equal(routes.genrePath('Rap'), routes.genrePath('Hip-Hop'));
  assert.notEqual(routes.genrePath('kaseko'), routes.genrePath('kasékò'));
  assert.equal(routes.findGenreBySlug('not-a-musical-genre'), null);
  const xml = sitemap.sitemapXml(sitemap.buildSitemapGroups([{id:'x',artist_name:'A',album_name:'B',review_count:1,genres:['Rock','rock','Pop']}]).catalog);
  assert.equal((xml.match(/\/generos\/rock</g) || []).length,1);
  assert.ok(!xml.includes('/generos/jazz'));
});

test('genre symbols repeat only inside the same musical family', () => {
  const seen = new Map(), cache = new Map();
  for (const genre of genres.GENRES) {
    const {src,family} = visuals.genreArtwork(genre.id);
    let symbol = src;
    if (!src.startsWith('data:')) {
      if (!cache.has(src)) cache.set(src, fs.readFileSync(new URL('../public'+src, import.meta.url),'utf8'));
      symbol = cache.get(src).match(/translate\(110 104\)[^>]*>(.*?)<\/g>/)?.[1];
      assert.ok(symbol, genre.id);
    }
    if (seen.has(symbol)) assert.equal(seen.get(symbol),family,genre.id);
    seen.set(symbol,family);
  }
});


test('every genre reveal has a separate center without an embedded outer record', () => {
  const checked = new Set();
  for (const genre of genres.GENRES) {
    const art = visuals.genreRevealArtwork(genre.id);
    assert.match(art.disc, /^\/genres\/colors\/v1\/[^/]+\.svg$/);
    assert.equal(art.center, visuals.genreRevealArtwork(genre.id, 'sandia').center);
    assert.match(art.center, /^\/genres\/symbols\/v3\/[^/]+\.svg$/);
    const svg = symbols.genreSymbol(genre.id).svg;
    assert.match(svg,/viewBox="0 0 100 100"/);
    assert.ok(!svg.includes('clipPath'),genre.id);
    assert.notEqual(art.center, art.src);
    checked.add(art.center);
  }
  assert.ok(checked.size >= 81);
});

test('the full registry uses named musical figures and a single monoline grid', async () => {
  const {default:library}=await import('../src/data/musicIconLibrary.json',{with:{type:'json'}});
  const {default:identities}=await import('../src/utils/genreIdentityPlan.cjs');
  assert.equal(library.grid,24);
  assert.equal(library.strokeWidth,2);
  assert.ok(Object.keys(library.icons).length>=169);
  for(const genre of genres.GENRES) {
    const identity=identities.genreIdentity(genre.id);
    assert.ok(library.icons[identity.figure],genre.id);
    assert.ok(['specific','family','general'].includes(identity.quality),genre.id);
    for(const detail of identity.details) assert.ok(library.icons[detail.icon],genre.id);
    assert.ok(!symbols.genreSymbol(genre.id).svg.includes('<polygon'),genre.id);
  }
  for(const [id,figure] of Object.entries({'metalcore':'bolt','hardcore punk':'safetyPin','gamelan gong kebyar':'gong','shabad kirtan':'harmonium','orkes gambus':'oud','sacred steel':'pedalSteel','ogene music':'cowbells','instrumental':'music'})) {
    assert.equal(identities.genreIdentity(id)?.figure,figure,id);
  }
  assert.equal(identities.genreIdentity('k-pop').figure,'lightstick');
  assert.equal(identities.genreIdentity('j-pop').figure,'flower');
  assert.deepEqual(identities.genreIdentity('classical').details,[]);
  assert.equal(identities.genreIdentity('bhangra').figure,'dhol');
  assert.equal(identities.genreIdentity('afroswing').figure,'boombox');
  assert.equal(identities.genreIdentity('slack-key guitar').figure,'acousticGuitar');
});

test('every library drawing renders as visible vector ink without remote assets', async () => {
  const {default:library}=await import('../src/data/musicIconLibrary.json',{with:{type:'json'}});
  const results=await Promise.all(Object.entries(library.icons).map(async ([id,icon])=>{
    assert.ok(!/script|foreignObject|<image|https?:|stroke-width=/.test(icon.body),id);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f57fa2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.body}</svg>`;
    const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let ink=0; for(let index=3;index<data.length;index+=info.channels) if(data[index]>0) ink++;
    return {id,ink};
  }));
  for(const {id,ink} of results) assert.ok(ink>20 && ink<48*48,id);
});

test('every canonical genre has a unique color combination shared by all its aliases', () => {
  const combinations = new Set(), records = new Set();
  for (const genre of genres.GENRES) {
    const art = visuals.genreRevealArtwork(genre.id);
    const combination = [art.base, art.accent, art.highlight].map(color => color.toLowerCase()).join('|');
    assert.ok(!combinations.has(combination), `repeated colors: ${genre.id}`);
    assert.ok(!records.has(art.disc), `repeated vinyl: ${genre.id}`);
    combinations.add(combination);
    records.add(art.disc);
    assert.deepEqual(art, visuals.genreRevealArtwork(genre.name));
  }
  assert.equal(combinations.size, genres.GENRES.length);
  assert.equal(visuals.genreRevealArtwork('Rap').disc, visuals.genreRevealArtwork('Hip-Hop').disc);
});


test('vinyl editions vary independently of genre and persist across reveal artwork', async () => {
  const {default: editions} = await import('../src/utils/vinylEditions.cjs');
  const {EDITIONS, drawVinylEdition, vinylEdition} = editions;
  assert.equal(new Set(EDITIONS.map(e => e.disc)).size, 24);
  assert.equal(new Set(Array.from({length:20}, (_,i) => vinylEdition(i).id)).size, 20);
  for (const genre of ['Rock', 'Jazz', 'Pop', 'qawwali']) {
    const centers = new Set();
    for (let i=0; i<EDITIONS.length; i++) {
      const pressing = drawVinylEdition(null, () => (i+.5)/EDITIONS.length);
      const art = visuals.genreRevealArtwork(genre, pressing.id);
      assert.equal(art.disc, EDITIONS[i].disc);
      assert.equal(art.glow, EDITIONS[i].base+'99');
      assert.deepEqual(art, visuals.genreRevealArtwork(genre, pressing.id));
      centers.add(art.center);
      assert.ok(fs.existsSync(new URL('../public'+art.disc, import.meta.url)));
    }
    assert.equal(centers.size, 1, 'pressing never changes the genre symbol');
  }
  for (const previous of EDITIONS) for (const random of [0, .5, .99999]) {
    assert.notEqual(drawVinylEdition(previous.id, () => random).id, previous.id);
  }
});


test('all genres have individual center geometry and metal subgenres retain their family figure', () => {
  const seen = new Set();
  for (const genre of genres.GENRES) {
    const symbol = symbols.genreSymbol(genre.id);
    assert.equal(symbol.key,genre.id);
    assert.ok(!seen.has(symbol.svg), genre.id);
    assert.ok(!/undefined|NaN|<text|<script|<foreignObject/.test(symbol.svg), genre.id);
    seen.add(symbol.svg);
  }
  const kinds = ['metal','black metal','death metal','doom metal','power metal','progressive metal','atmospheric black metal'];
  const variants = kinds.map(id=>symbols.genreSymbol(id));
  assert.ok(variants.every(v=>v.family==='metal'));
  assert.equal(new Set(variants.map(v=>v.svg)).size,kinds.length);
  assert.equal(symbols.genreSymbol('death metal').modifier,'death');
  assert.equal(symbols.genreSymbol('doom metal').modifier,'doom');
  assert.equal(symbols.genreSymbol('atmospheric black metal').modifier,'atmospheric');
  assert.equal(symbols.genreSymbol('not-a-musical-genre'),null);
});
