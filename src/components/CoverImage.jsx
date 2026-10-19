'use client';
import Image from 'next/image';

export function CoverImage({ src, alt = '', loading = 'lazy', ...props }) {
  let optimized = String(src || '').startsWith('/');
  try {
    const host = new URL(src).hostname;
    optimized ||= ['i.scdn.co', 'mosaic.scdn.co', 't.scdn.co', 'coverartarchive.org', 'archive.org', 'images.unsplash.com', 'lh3.googleusercontent.com', 'cdn.rcrd.club', 'cdn-images.dzcdn.net', 'i.pinimg.com'].includes(host) || host.endsWith('.supabase.co') ||
      (host === 'www.serebii.net' && new URL(src).pathname.startsWith('/dungeonrescueteamdx/pokemon/'));
  } catch {}
  return <Image width={320} height={320} sizes="(max-width: 640px) 45vw, 240px" src={src || '/musiclub_logo_corchea.png'} alt={alt} loading={loading} unoptimized={!optimized} {...props} />;
}
