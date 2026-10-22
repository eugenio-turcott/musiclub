import editions from '../utils/releaseEditions.cjs';
import reviewChronology from '../utils/reviewChronology.cjs';
import 'server-only';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { buildAlbumWithFullStats } from '../services/supabaseClient';
import { PUBLIC_REVIEW_FIELDS, publicData } from '../utils/publicData';
import { slugifyArtist, splitArtists, getReleaseUrl } from '../utils/ratingUtils';
import releaseIdentity from '../utils/releaseIdentity.cjs';
import releaseLookup from '../utils/publicReleaseLookup.cjs';
import { getStoredArtistProfile } from './artistProfile';
import { fetchRecordClubTracks } from '../services/albumEnrichmentService';

const ALBUM_FIELDS = 'id,album_name,artist_name,image_url,release_type,release_year,release_date,tracks,genres,spotify_link,youtube_link,apple_music_link,other_link,reviews_enabled,created_at,total_tracks,label,country,barcode,mbid';
function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
}
async function allRows(db, table, fields, cached = true) {
  const rows = [];
  for (let from = 0; ; from += 100) {
    const read = async () => {
      const result = await db.from(table).select(fields).order('id').range(from, from + 99);
      if (result.error) throw new Error(`No se pudo leer el catálogo público (${table})`);
      return result.data;
    };
    const data = cached ? await unstable_cache(read, ['public-catalog-rows-v96', table, fields, String(from)], { revalidate: 300, tags: ['catalog'] })() : await read();
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
  const detailed = editions.groupReleaseEditions(albums).map(album => publicData({
    ...buildAlbumWithFullStats(album, (album.edition_member_ids || [album.id]).flatMap(id=>byAlbum.get(id)||[]), profiles),
    status: album.status, reviews_enabled: album.reviews_enabled,
    album: album.album_name, artista: album.artist_name, imagen: album.image_url,
    // Collection pages use aggregate statistics. Full reviews/tracks statistics are resolved per detail page.
    reviews: [], track_stats: [],
  }));
  const byId = new Map(detailed.flatMap(a => (a.edition_member_ids || [a.id]).map(id=>[id,a])));
  return { albums: detailed, rawAlbums: publicData(albums), reviews: publicData(reviewChronology.sortReviewsNewestFirst(reviews.map(r => ({ ...r, albums: byId.get(r.album_id) ? {
    id: r.album_id, album_name: byId.get(r.album_id).album_name, artist_name: byId.get(r.album_id).artist_name,
    image_url: byId.get(r.album_id).image_url, release_type: byId.get(r.album_id).release_type,
    release_year: byId.get(r.album_id).release_year, tracks: byId.get(r.album_id).tracks,
  } : null })))),
    stats: { total_reviews: reviews.length, total_albums: detailed.length,
      total_reviewed_albums: detailed.filter(a => a.review_count > 0).length,
      total_users: profiles.length, top_score: Math.max(0, ...detailed.map(a => a.final_rating || 0)) } };
});

export const getPublicAlbum = cache(async slug => {
  const { albums, rawAlbums, reviews } = await getPublicCatalog();
  const detail = album => publicData({ ...album, ...buildAlbumWithFullStats(album,
    reviews.filter(r => (album.edition_member_ids || [album.id]).includes(r.album_id)).map(({ albums: relation, ...review }) => review)) });
  // A newly inserted release can be absent from the five-minute collection cache.
  // Check public rows directly on a miss before returning a real 404.
  const found = await releaseLookup.resolvePublicRelease(slug, [...albums,...rawAlbums],
    () => allRows(client(), 'albums', ALBUM_FIELDS, false));
  if (found?.album) {
    if (!found.fresh) return detail(albums.find(album=>(album.edition_member_ids || [album.id]).includes(found.album.id)) || found.album);
    const result = await client().from('public_reviews').select(PUBLIC_REVIEW_FIELDS).eq('album_id', found.album.id);
    if (result.error) throw new Error('No se pudieron leer las reseñas públicas');
    return publicData(buildAlbumWithFullStats(found.album, result.data || []));
  }
  // Existing anticipated releases remain readable without creating database records.
  const { data, error } = await client().from('record_club_upcoming').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error('No se pudieron consultar los próximos estrenos');
  if (!data) return null;
  const storedTracks = Array.isArray(data.tracks) ? data.tracks : [];
  const announcedTracks = await unstable_cache(
    () => fetchRecordClubTracks(data.id), ['upcoming-tracks-v916', data.id], { revalidate: 900 }
  )();
  const tracks = announcedTracks.length ? announcedTracks.map(track => {
    const saved = storedTracks.find(t => (t.disc_number || 1) === (track.disc_number || 1) && t.track_number === track.track_number);
    return /^Track\s+\d+$/i.test(track.name || '') && saved?.name && !/^Track\s+\d+$/i.test(saved.name) ? saved : track;
  }) : storedTracks;
  const future = Boolean(data.release_date && data.release_date.slice(0,10) > new Date().toISOString().slice(0,10));
  return publicData({ ...data, id: data.id, reviews: [], review_count: 0, final_rating: null,
    tracks, track_stats: tracks, criteria_averages: {},
    total_tracks: Math.max(Number(data.total_tracks) || 0, tracks.length),
    is_upcoming: future, is_anticipated: future, reviews_enabled: future ? false : data.reviews_enabled });
});

export const getPublicArtist = cache(async slug => {
  const { albums } = await getPublicCatalog();
  const canonicalSlug = releaseIdentity.decodeRouteSlug(slug).toLowerCase();
  const clubAlbums = albums.filter(a => slugifyArtist(a.artist_name) === canonicalSlug ||
    splitArtists(a.artist_name).some(artist => artist.slug === canonicalSlug));
  const sample = clubAlbums[0];
  const { data: upcoming } = await client().from('record_club_upcoming').select('*').eq('artist_slug', canonicalSlug);
  const name = sample ? (splitArtists(sample.artist_name).find(a => a.slug === canonicalSlug)?.name || sample.artist_name) : upcoming?.[0]?.artist_name || canonicalSlug.replace(/-/g, ' ');
  const external = await getStoredArtistProfile(client(), canonicalSlug, name, Boolean(sample || upcoming?.length));
  if (!sample && !external && !upcoming?.length) return null;
  const discography = editions.groupReleaseEditions(external?.discography || []);
  for (const a of clubAlbums) {
    const links=[a.spotify_link,a.other_link,a.apple_music_link].filter(Boolean).map(link=>link.split('?')[0].replace(/\/$/,''));
    const editionKey=name=>releaseIdentity.slugify(editions.editionTitle(name).name,true);
    const match = discography.find(d => (d.sources || []).some(source=>source.url && links.includes(source.url.split('?')[0].replace(/\/$/,'')))) ||
      discography.find(d => editionKey(d.name)===editionKey(a.album_name));
    if (match) { match.image = a.image_url || match.image; match.totalTracks = a.total_tracks || a.tracks?.length || match.totalTracks; match.clubAlbumId=a.id; match.genres=a.genres || match.genres; }
    else discography.push({ id: a.id, clubAlbumId:a.id, mbid: a.mbid, name: a.album_name, artists: [a.artist_name],
      image: a.image_url, releaseYear: a.release_year, releaseDate: a.release_date || '',
      genres:a.genres || [], release_type: a.release_type, totalTracks: a.tracks?.length || a.total_tracks || 0, spotifyUrl: a.spotify_link });
  }
  for (const release of upcoming || []) {
    const match = discography.find(d => d.name.toLowerCase().trim() === release.album_name.toLowerCase().trim());
    const metadata = { image: release.image_url, totalTracks: release.total_tracks, clubUrl: `/albumes/${release.slug}`, isUpcoming: true };
    if (match) Object.assign(match, metadata);
    else discography.push({ id: release.id, name: release.album_name, releaseDate: release.release_date || '', releaseYear: Number(release.release_date?.slice(0,4)) || null, release_type: release.release_type || 'ALBUM', ...metadata });
  }
  const groupedDiscography=editions.groupReleaseEditions(discography).map(({editionVariants,...release})=>release);
  groupedDiscography.sort((a,b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
  return { albums: clubAlbums, profile: { ...external, success: true, artist: {
    ...external?.artist, name: external?.artist?.name || name,
    image: external?.artist?.image || sample?.image_url || '',
    genres: [...new Set([...(external?.artist?.genres || []), ...clubAlbums.flatMap(a => a.genres || [])])],
  }, topTracks: external?.topTracks || [], discography:groupedDiscography,
    albums: groupedDiscography.filter(a => a.release_type === 'ALBUM'), eps: groupedDiscography.filter(a => a.release_type === 'EP'),
    singles: groupedDiscography.filter(a => /SINGLE|SENCILLO/.test(a.release_type)), compilations: groupedDiscography.filter(a => a.release_type === 'COMPILACION') } };
});
