import files from '../../../../../utils/genreAssetFiles.cjs';

export const runtime = 'nodejs';
export async function GET(request, { params }) {
  const { file } = await params;
  if (!file.endsWith('.png')) return new Response(null, { status: 404 });
  const asset = files.genreAssetPath(file.slice(0, -4));
  if (!asset) return new Response(null, { status: 404 });
  return Response.redirect(new URL(asset,request.url),308);
}
