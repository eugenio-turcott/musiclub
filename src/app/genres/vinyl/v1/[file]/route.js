import sharp from 'sharp';
import artwork from '../../../../../utils/genreEmailArtwork.cjs';

export const runtime = 'nodejs';
export async function GET(request, { params }) {
  const { file } = await params;
  if (!file.endsWith('.png')) return new Response(null, { status: 404 });
  const svg = artwork.genreEmailSvg(file.slice(0, -4));
  if (!svg) return new Response(null, { status: 404 });
  const png = await sharp(Buffer.from(svg)).resize(640, 640).png().toBuffer();
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
