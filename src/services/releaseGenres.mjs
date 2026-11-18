import remoteGenres from '../utils/remoteReleaseGenres.cjs';
import {searchDeezerAlbums,getDeezerAlbumDetails} from './deezerApi.js';

// All import entrances use the same exact-edition recovery. Recognized source
// genres return immediately, without extra requests or asking members to classify.
export function resolveReleaseGenres(artist,title,sources,edition={}) {
 return remoteGenres.resolveGenres(artist,title,sources,
  {search:searchDeezerAlbums,details:getDeezerAlbumDetails},edition);
}
