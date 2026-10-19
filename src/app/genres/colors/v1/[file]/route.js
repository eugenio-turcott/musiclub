import catalog from '../../../../../utils/genreCatalog.cjs';
import editions from '../../../../../utils/vinylEditions.cjs';
import artwork from '../../../../../utils/vinylDisc.cjs';

export async function GET(request, { params }) {
  const { file } = await params;
  const raw = file.endsWith('.svg') ? file.slice(0, -4) : '';
  const key = catalog.genreKey(raw);
  if (!key || key !== raw) return new Response(null, {status:404});
  return new Response(artwork.vinylDiscSvg(editions.defaultEdition(key)), {
    headers: {'Content-Type':'image/svg+xml; charset=utf-8', 'Cache-Control':'public, max-age=31536000, immutable', 'X-Content-Type-Options':'nosniff'},
  });
}
