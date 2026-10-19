import catalog from '../../../../../utils/genreCatalog.cjs';
import symbols from '../../../../../utils/genreSymbols.cjs';

export async function GET(request, {params}) {
  const {file} = await params;
  const raw = file.endsWith('.svg') ? file.slice(0,-4) : '';
  const key = catalog.genreKey(raw);
  if (!key || key !== raw) return new Response(null,{status:404});
  return new Response(symbols.genreSymbol(key).svg, {headers:{'Content-Type':'image/svg+xml; charset=utf-8', 'Cache-Control':'public, max-age=31536000, immutable', 'X-Content-Type-Options':'nosniff'}});
}
