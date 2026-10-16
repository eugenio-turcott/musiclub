import { NextResponse } from 'next/server';
import { allowRequest } from '../../../server/rateLimit';

let token;
let expires = 0;
let pendingToken;
async function appToken() {
  if (token && Date.now() < expires) return token;
  if (pendingToken) return pendingToken;
  pendingToken = (async () => {
    const id = process.env.SPOTIFY_CLIENT_ID || process.env.REACT_APP_SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const secret = process.env.SPOTIFY_CLIENT_SECRET || process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    if (!id || !secret) throw new Error('Spotify no está configurado');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}` },
      body: 'grant_type=client_credentials', signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Spotify no está disponible');
    const data = await response.json();
    token = data.access_token; expires = Date.now() + (data.expires_in - 60) * 1000;
    return token;
  })();
  try { return await pendingToken; } finally { pendingToken = null; }
}

export async function GET(request) {
  if (!allowRequest(`spotify:${request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'}`, 120)) {
    return NextResponse.json({ error: 'Espera antes de buscar de nuevo' }, { status: 429, headers: { 'Retry-After': '60' } });
  }
  const resource = new URL(request.url).searchParams.get('path') || '';
  const [pathname] = resource.split('?');
  // Fixed upstream and read-only resources; no arbitrary URL, credentials or writes.
  if (resource.length > 1500 || !/^\/v1\/(search|albums\/[A-Za-z0-9]{22}(?:\/tracks)?|artists\/[A-Za-z0-9]{22}(?:\/(albums|top-tracks))?|playlists\/[A-Za-z0-9]{22}(?:\/tracks)?|recommendations)$/.test(pathname)) {
    return NextResponse.json({ error: 'Recurso no permitido' }, { status: 400 });
  }
  const upstream = new URL(resource, 'https://api.spotify.com');
  if ([...upstream.searchParams.keys()].some(k => !['q','type','limit','offset','market','include_groups','fields','seed_artists','seed_genres','seed_tracks','min_popularity','max_popularity','target_popularity'].includes(k))) {
    return NextResponse.json({ error: 'Parámetros no permitidos' }, { status: 400 });
  }
  try {
    const response = await fetch(upstream, { headers: { Authorization: `Bearer ${await appToken()}` },
      signal: AbortSignal.timeout(10000), next: { revalidate: 300 } });
    if (response.status === 401) { token = null; expires = 0; }
    if (!response.ok) return NextResponse.json({ error: 'Spotify no está disponible' }, {
      status: response.status === 429 ? 429 : 502,
      headers: response.status === 429 ? { 'Retry-After': response.headers.get('retry-after') || '60' } : {},
    });
    return NextResponse.json(await response.json(), { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch { return NextResponse.json({ error: 'Spotify no está disponible' }, { status: 503 }); }
}
