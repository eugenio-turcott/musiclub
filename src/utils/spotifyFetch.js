// Browser requests never receive an application token or client secret.
export async function spotifyFetch(input, options) {
  const url = new URL(String(input), 'https://www.musiclub.org');
  if (typeof window !== 'undefined' && url.origin === 'https://api.spotify.com') {
    return globalThis.fetch(`/api/spotify?path=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return globalThis.fetch(input, options);
}
