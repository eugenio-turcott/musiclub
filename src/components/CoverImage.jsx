'use client';
import Image from 'next/image';

export function CoverImage({ src, alt = '', loading = 'lazy', sizes = '(max-width: 640px) 45vw, 240px', ...props }) {
  // This CDN already resizes and compresses covers; avoid a second image proxy.
  try {
    const image = new URL(src);
    if (image.hostname === 'cdn.rcrd.club') {
      const source = width => { const url = new URL(image); url.searchParams.set('width', String(width)); return url.href; };
      return <img width={320} height={320} src={source(480)} srcSet={[240,480,720].map(width=>`${source(width)} ${width}w`).join(', ')} sizes={sizes} alt={alt} loading={loading} decoding="async" {...props}/>;
    }
  } catch {}
  let optimized = String(src || '').startsWith('/');
  try {
    const host = new URL(src).hostname;
    optimized ||= ['i.scdn.co', 'mosaic.scdn.co', 't.scdn.co', 'coverartarchive.org', 'archive.org', 'images.unsplash.com', 'lh3.googleusercontent.com', 'cdn.rcrd.club', 'cdn-images.dzcdn.net', 'i.pinimg.com'].includes(host) || host.endsWith('.supabase.co') ||
      (host === 'www.serebii.net' && new URL(src).pathname.startsWith('/dungeonrescueteamdx/pokemon/'));
  } catch {}
  return <Image width={320} height={320} sizes={sizes} src={src || '/musiclub_logo_corchea.png'} alt={alt} loading={loading} unoptimized={!optimized} {...props} />;
}
