import catalog from '../../src/utils/genreCatalog.cjs';
import ids from '../../src/data/musicbrainzGenreIds.json' with { type: 'json' };

export function planReleaseGenres(albums, assignments) {
  const supplements = new Map(assignments.map(row => [String(row.id), row]));
  return albums.map(album => {
    const supplement = supplements.get(String(album.id));
    if (supplement && (supplement.album_name !== album.album_name || supplement.artist_name !== album.artist_name)) {
      throw new Error(`Release identity changed: ${album.id}`);
    }
    const before = album.genres;
    const genres = catalog.normalizeGenres(supplement?.genres || (Array.isArray(before) ? before.map(value => ids[value] || value) : []));
    if (!genres.length) throw new Error(`Missing verified genre: ${album.id} / ${album.album_name}`);
    return { id: album.id, album_name: album.album_name, artist_name: album.artist_name, before, genres,
      changed: JSON.stringify(before) !== JSON.stringify(genres), sources: supplement?.sources || [] };
  });
}
