import { writeFile } from 'node:fs/promises';
const response = await fetch('https://musicbrainz.org/genres', {
  headers: { 'User-Agent': 'Musiclub/9.8 (https://www.musiclub.org)' }, signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`MusicBrainz HTTP ${response.status}`);
const html = await response.text();
const decode = text => text.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const ids = Object.fromEntries([...html.matchAll(/href="\/genre\/([a-f0-9-]{36})"[^>]*>\s*<bdi>([^<]+)<\/bdi>/g)].map(match => [match[1], decode(match[2])]));
const names = [...new Set(Object.values(ids))].sort();
if (names.length < 2000 || names.some(name => !name.trim() || /^[a-f0-9-]{36}$/i.test(name))) throw new Error('Invalid or incomplete genre registry');
await writeFile(new URL('../src/data/musicGenres.json', import.meta.url), JSON.stringify(names) + '\n');
await writeFile(new URL('../src/data/musicbrainzGenreIds.json', import.meta.url), JSON.stringify(ids) + '\n');
console.log(`Saved ${names.length} official MusicBrainz genre names and their IDs. Review changes before publishing.`);
