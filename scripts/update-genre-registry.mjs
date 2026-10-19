import { readFile, writeFile } from 'node:fs/promises';
const response = await fetch('https://musicbrainz.org/genres', {
  headers: { 'User-Agent': 'Musiclub/9.14 (https://www.musiclub.org)' }, signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`MusicBrainz HTTP ${response.status}`);
const html = await response.text();
const decode = text => text.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const ids = Object.fromEntries([...html.matchAll(/href="\/genre\/([a-f0-9-]{36})"[^>]*>\s*<bdi>([^<]+)<\/bdi>/g)].map(match => [match[1], decode(match[2])]));
const freshNames = [...new Set(Object.values(ids))];
if (freshNames.length < 2000 || freshNames.some(name => !name.trim() || name.length>120 || /[<>\x00-\x1f]/.test(name) || /^[a-f0-9-]{36}$/i.test(name))) throw new Error('Invalid or incomplete genre registry');
const previousNames = JSON.parse(await readFile(new URL('../src/data/musicGenres.json', import.meta.url),'utf8'));
const previousIds = JSON.parse(await readFile(new URL('../src/data/musicbrainzGenreIds.json', import.meta.url),'utf8'));
// Never invalidate genres attached to existing releases if the provider renames or retires a tag.
const previousSet = new Set(previousNames);
const names = [...previousNames,...freshNames.filter(name=>!previousSet.has(name)).sort()];
await writeFile(new URL('../src/data/musicGenres.json', import.meta.url), JSON.stringify(names) + '\n');
await writeFile(new URL('../src/data/musicbrainzGenreIds.json', import.meta.url), JSON.stringify({...previousIds,...ids}) + '\n');
console.log(`Saved ${names.length} verified genre names; ${names.length-previousNames.length} additions. Existing release labels are preserved.`);
