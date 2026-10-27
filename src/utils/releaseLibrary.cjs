const editions = require('./releaseEditions.cjs');

function releaseSnapshot(album = {}) {
  const text = (value, max = 2000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  return {
    id: text(String(album.id || ''), 200),
    edition_member_ids: [...new Set([album.id, ...(album.edition_member_ids || [])].filter(Boolean).map(value => String(value).slice(0, 200)))].slice(0, 64),
    album_name: text(album.album_name || album.album || album.name, 500),
    artist_name: text(album.artist_name || album.artista || album.artist || album.artists?.join(' & '), 500),
    release_type: text(album.release_type || album.releaseType || 'ALBUM', 40),
    image_url: text(album.image_url || album.imagen || album.image),
    spotify_link: text(album.spotify_link || album.spotifyLink || album.spotify_url || album.spotifyUrl),
    apple_music_link: text(album.apple_music_link || album.appleMusicLink),
    youtube_link: text(album.youtube_link || album.youtubeLink),
    other_link: text(album.other_link || album.otherLink || album.deezer_link),
  };
}
function releaseKey(album) { return editions.editionKey(releaseSnapshot(album)); }
function preferenceMatch(album = {}) {
  const key = releaseKey(album);
  const ids = new Set([album.id, ...(album.edition_member_ids || [])].filter(Boolean).map(String));
  return row => row.release_key === key ||
    [row.release?.id, ...(row.release?.edition_member_ids || [])].filter(Boolean).some(id => ids.has(String(id)));
}
function findPreference(album, rows = []) {
  const matches = preferenceMatch(album);
  return rows.find(row => row.release_key === album?.preference_key && matches(row)) || rows.find(matches);
}
function isDismissed(album, rows = []) {
  const matches = preferenceMatch(album);
  return rows.some(row => row.gashapon_dismissed && matches(row));
}
function streamingLinks(album) {
  const release = releaseSnapshot(album);
  const query = encodeURIComponent(`${release.artist_name} ${release.album_name}`.trim());
  const safe = (value, hosts) => {
    try { const url = new URL(value); return url.protocol === 'https:' && hosts.includes(url.hostname) ? url.href : null; } catch { return null; }
  };
  return [
    { id: 'spotify', name: 'Spotify', href: safe(release.spotify_link, ['open.spotify.com']) || `https://open.spotify.com/search/${query}` },
    { id: 'apple', name: 'Apple Music', href: safe(release.apple_music_link, ['music.apple.com']) || `https://music.apple.com/search?term=${query}` },
    { id: 'youtube', name: 'YouTube Music', href: safe(release.youtube_link, ['music.youtube.com', 'www.youtube.com', 'youtube.com', 'youtu.be']) || `https://music.youtube.com/search?q=${query}` },
    { id: 'deezer', name: 'Deezer', href: safe(release.other_link, ['www.deezer.com', 'deezer.com', 'link.deezer.com']) || `https://www.deezer.com/search/${query}` },
  ];
}
module.exports = { releaseSnapshot, releaseKey, findPreference, isDismissed, streamingLinks };
