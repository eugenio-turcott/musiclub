import catalog from './genreCatalog.cjs';
export const CANONICAL_GENRES = new Set(catalog.GENRES.map(genre => genre.name));
export const normalizeCanonicalGenres = catalog.normalizeGenres;
