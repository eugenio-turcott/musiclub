import 'server-only';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { buildAlbumWithFullStats } from '../services/supabaseClient';
import { PUBLIC_REVIEW_FIELDS, publicData } from '../utils/publicData';
import { slugifyArtist, slugifyAlbum, splitArtists, getReleaseUrl } from '../utils/ratingUtils';
import { getArtistCompleteProfile } from '../services/spotifyApi';
import releaseIdentity from '../utils/releaseIdentity.cjs';

const ALBUM_FIELDS = 'id,album_name,artist_name,image_url,release_type,release_year,release_date,tracks,genres,spotify_link,youtube_link,apple_music_link,other_link,reviews_enabled,created_at,total_tracks,label,country,barcode,mbid';
function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
}
async function allRows(db, table, fields) {
  const rows = [];
  for (let from = 0; ; from += 100) {
    const data = await unstable_cache(async () => {
      const result = await db.from(table).select(fields).order('id').range(from, from + 99);
      if (result.error) throw new Error(`No se pudo leer el catálogo público (${table})`);
      return result.data;
    }, ['public-catalog-rows-v96', table, fields, String(from)], { revalidate: 300, tags: ['catalog'] })();
    rows.push(...data);
    if (data.length < 100) return rows;
  }
}
export const getPublicCatalog = cache(async () => {
  const db = client();
  const [albums, reviews, profiles] = await Promise.all([
    allRows(db, 'albums', ALBUM_FIELDS), allRows(db, 'public_reviews', PUBLIC_REVIEW_FIELDS),
    allRows(db, 'public_profiles', 'id,name,avatar_url'),
  ]);
  const byAlbum = new Map();
  for (const review of reviews) {
    if (!byAlbum.has(review.album_id)) byAlbum.set(review.album_id, []);
    byAlbum.get(review.album_id).push(review);
  }
  const detailed = albums.map(album => publicData({
    ...buildAlbumWithFullStats(album, byAlbum.get(album.id) || [], profiles),
    status: album.status, reviews_enabled: album.reviews_enabled,
    album: album.album_name, artista: album.artist_name, imagen: album.image_url,
    // Collection pages use aggregate statistics. Full reviews/tracks statistics are resolved per detail page.
    reviews: [], track_stats: [],
  }));
  const byId = new Map(detailed.map(a => [a.id, a]));
  return { albums: detailed, reviews: publicData(reviews.map(r => ({ ...r, albums: byId.get(r.album_id) ? {
    id: r.album_id, album_name: byId.get(r.album_id).album_name, artist_name: byId.get(r.album_id).artist_name,
    image_url: byId.get(r.album_id).image_url, release_type: byId.get(r.album_id).release_type,
    release_year: byId.get(r.album_id).release_year, tracks: byId.get(r.album_id).tracks,
  } : null })).sort((a,b) => String(b.created_at).localeCompare(String(a.created_at)))),
    stats: { total_reviews: reviews.length, total_albums: detailed.length,
      total_reviewed_albums: detailed.filter(a => a.review_count > 0).length,
      total_users: profiles.length, top_score: Math.max(0, ...detailed.map(a => a.final_rating || 0)) } };
});

export const getPublicAlbum = cache(async slug => {
  const { albums, reviews } = await getPublicCatalog();
  const detail = album => publicData({ ...album, ...buildAlbumWithFullStats(album,
    reviews.filter(r => r.album_id === album.id).map(({ albums: relation, ...review }) => review)) });
  // Legacy titles shared by multiple artists must not redirect to an arbitrary album.
  const clean = releaseIdentity.decodeRouteSlug(slug).toLowerCase();
  const byIdentity = albums.find(a => a.id === slug || getReleaseUrl(a).split('/').pop() === clean);
  if (byIdentity) return detail(byIdentity);
  const legacy = albums.filter(a => slugifyAlbum(a.album_name) === clean);
  if (legacy.length === 1) return detail(legacy[0]);
  // Existing anticipated releases remain readable without creating database records.
  const { data, error } = await client().from('record_club_upcoming').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error('No se pudieron consultar los próximos estrenos');
  return data ? publicData({ ...data, id: data.id, reviews: [], review_count: 0, final_rating: null,
    tracks: data.tracks || [], track_stats: [], criteria_averages: {} }) : null;
});

export const getPublicArtist = cache(async slug => {
  const { albums } = await getPublicCatalog();
  const canonicalSlug = releaseIdentity.decodeRouteSlug(slug).toLowerCase();
  const clubAlbums = albums.filter(a => slugifyArtist(a.artist_name) === canonicalSlug ||
    splitArtists(a.artist_name).some(artist => artist.slug === canonicalSlug));
  if (!clubAlbums.length) {
    const profile = await getArtistCompleteProfile(canonicalSlug.replace(/-/g, ' '));
    return profile?.success && profile.artist ? { albums: [], profile } : null;
  }
  const sample = clubAlbums[0];
  const name = splitArtists(sample.artist_name).find(a => a.slug === canonicalSlug)?.name || sample.artist_name;
  const discography = clubAlbums.map(a => ({ id: a.id, name: a.album_name, artists: [a.artist_name],
    image: a.image_url, releaseYear: a.release_year, releaseDate: a.release_date,
    release_type: a.release_type, totalTracks: a.tracks?.length || a.total_tracks || 0, spotifyUrl: a.spotify_link }));
  return { albums: clubAlbums, profile: { success: true, artist: { id: null, name,
    image: sample.image_url, genres: [...new Set(clubAlbums.flatMap(a => a.genres || []))],
    followers: null, popularity: null, spotifyUrl: null }, topTracks: [], discography,
    albums: discography.filter(a => a.release_type === 'ALBUM'), eps: discography.filter(a => a.release_type === 'EP'),
    singles: discography.filter(a => /SINGLE|SENCILLO/.test(a.release_type)), compilations: [] } };
});
