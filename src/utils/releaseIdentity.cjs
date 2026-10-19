function slugify(value, release = false) {
  let text = String(value || '');
  if (release) text = text.replace(/\+/g, ' plus ');
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '').replace(/&/g, 'and')
    .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').toLowerCase();
}
function getReleaseTypePrefix(value) {
  const type = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  if (['EP','SINGLE_EP','EPS'].includes(type)) return 'eps';
  if (['SENCILLO','SENCILLOS','SINGLE','SINGLES','TRACK','CANCION'].includes(type)) return 'sencillos';
  if (['COMPILACION','COMPILACIONES','COMPILATION','COMPILATIONS','ANTHOLOGY','BOXSET'].includes(type)) return 'compilaciones';
  if (['REMIX','REMIXES','REMIXED'].includes(type)) return 'remixes';
  return 'albumes';
}
function releasePath(album) {
  const name = slugify(album.album_name || album.album || album.name, true);
  const artist = slugify(album.artist_name || album.artist || album.artista);
  if (!name || !artist) return null;
  return `/${getReleaseTypePrefix(album.release_type || album.releaseType)}/${artist}-${name}`;
}
function decodeRouteSlug(value) {
  const slug = String(value || '');
  try { return decodeURIComponent(slug); } catch { return slug; }
}
module.exports = { slugify, getReleaseTypePrefix, releasePath, decodeRouteSlug };
