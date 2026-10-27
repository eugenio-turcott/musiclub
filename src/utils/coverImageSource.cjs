const optimizedHosts = new Set(['i.scdn.co', 'mosaic.scdn.co', 't.scdn.co', 'coverartarchive.org', 'archive.org', 'images.unsplash.com', 'lh3.googleusercontent.com', 'cdn-images.dzcdn.net', 'i.pinimg.com']);

function coverImageSource(src, attempt = 0) {
  const original = typeof src === 'string' ? src.trim() : '';
  if (!original || attempt >= 2) return { fallback: true };
  // Retry the exact stored URL without srcset or Next's image proxy.
  if (attempt === 1) return { src: original, optimized: false };
  let optimized = original.startsWith('/') && !original.startsWith('//');
  try {
    const image = new URL(original);
    if (image.hostname === 'cdn.rcrd.club') {
      const resized = width => {
        const url = new URL(image);
        url.searchParams.set('width', String(width));
        return url.href;
      };
      return { src: resized(480), srcSet: [240, 480, 720].map(width => `${resized(width)} ${width}w`).join(', '), optimized: false };
    }
    optimized ||= optimizedHosts.has(image.hostname) || image.hostname.endsWith('.supabase.co') ||
      (image.hostname === 'www.serebii.net' && image.pathname.startsWith('/dungeonrescueteamdx/pokemon/'));
  } catch {}
  return { src: original, optimized };
}

module.exports = { coverImageSource };
