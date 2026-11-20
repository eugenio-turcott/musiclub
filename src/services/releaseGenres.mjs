import remoteGenres from '../utils/remoteReleaseGenres.cjs';
import {searchDeezerAlbums,getDeezerAlbumDetails} from './deezerApi.js';
import {searchAppleReleases,getAppleReleaseDetails} from './appleMusicCatalog.mjs';
import catalog from '../utils/genreCatalog.cjs';

// All import entrances use the same exact-edition recovery. Recognized source
// genres return immediately, without extra requests or asking members to classify.
export async function resolveReleaseGenres(artist,title,sources=[],edition={}) {
 for(const source of sources){const known=catalog.normalizeGenres(source);if(known.length)return known;}
 let timer;
 const providers=[{search:searchDeezerAlbums,details:getDeezerAlbumDetails},{search:searchAppleReleases,details:getAppleReleaseDetails}];
 const attempts=providers.map(provider=>remoteGenres.resolveGenres(artist,title,[],provider,edition).then(genres=>{if(!genres.length)throw new Error('No verified genre');return genres;}));
 attempts.push(import('./musicBrainzService.js').then(async mb=>catalog.normalizeGenres((await mb.getFullMusicBrainzAlbumData(artist,title))?.genres)).then(genres=>{if(!genres.length)throw new Error('No verified genre');return genres;}));
 try{return await Promise.race([Promise.any(attempts).catch(()=>[]),new Promise(resolve=>{timer=setTimeout(()=>resolve([]),Math.min(12000,edition.budgetMs||4500));})]);}
 finally{clearTimeout(timer);}
}
