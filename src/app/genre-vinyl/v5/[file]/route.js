import catalog from '../../../../utils/genreCatalog.cjs';
import files from '../../../../utils/genreAssetFiles.cjs';

// Keep links to previously downloaded and emailed assets working after the cache version changes.
export async function GET(request, {params}) {
  const {file} = await params;
  const match = /^([\w-]+)\.(png|svg)$/.exec(file);
  if(!match) return new Response(null,{status:404});
  const key = Buffer.from(match[1],'base64url').toString('utf8');
  if(catalog.genreKey(key)!==key || Buffer.from(key).toString('base64url')!==match[1]) return new Response(null,{status:404});
  const asset = match[2]==='svg' ? files.genreSvgAssetPath(key) : files.genreAssetPath(key);
  return Response.redirect(new URL(asset,request.url),308);
}
