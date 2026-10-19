import { mkdir, writeFile } from 'node:fs/promises';
import catalog from '../src/utils/genreCatalog.cjs';
const values = catalog.GENRES.map(genre => `'${genre.name.replace(/'/g, "''")}'`).join(',\n    ');
const sql = `-- Run after migrate-release-genres.mjs --apply. Regenerate when expanding the registry.
-- Only validates public.albums.genres; no changes to permissions or other album fields.
begin;
alter table public.albums drop constraint if exists musiclub_release_genres_valid;
alter table public.albums add constraint musiclub_release_genres_valid check (
  genres is not null and cardinality(genres) > 0
  and array_position(genres, null) is null
  and genres <@ array[
    ${values}
  ]::text[]
) not valid;
alter table public.albums validate constraint musiclub_release_genres_valid;
commit;
select count(*) as releases, count(*) filter (where genres is null or cardinality(genres)=0) as missing_genres
from public.albums;
`;
await mkdir('supabase/migrations', { recursive: true });
await writeFile('supabase/migrations/20261019_v98_release_genres.sql', sql);
console.log(`Generated constraint for ${catalog.GENRES.length} recognized genre labels.`);
