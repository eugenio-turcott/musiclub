import identity from '../utils/releaseIdentity.cjs';
import sitemapData from '../utils/sitemapData.cjs';
import genreRoutes from '../utils/genreRoutes.cjs';
const ORIGIN='https://www.musiclub.org';
export const DISCOVERY_ORIGIN=ORIGIN;
const decode=value=>String(value||'').replace(/&(?:amp|quot|apos|lt|gt);|&#(?:x[\da-f]+|\d+);/gi,entity=>{
 const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};return named[entity.toLowerCase()]??String.fromCodePoint(parseInt(entity.slice(2,-1).replace(/^x/i,''),/^&#x/i.test(entity)?16:10));
});
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(m=>[m[1].toLowerCase(),decode(m[3])]));
const normalized=url=>new URL(url,ORIGIN).href;
function fail(code){const error=new Error(code);error.code=code;throw error;}
export function parseDiscoverySitemap(xml){
 if(!/<urlset\b/i.test(xml)||!/<\/urlset>\s*$/i.test(xml))fail('invalid_sitemap');
 return new Map([...xml.matchAll(/<url>\s*([\s\S]*?)<\/url>/gi)].map(match=>{
  const loc=match[1].match(/<loc>(.*?)<\/loc>/s)?.[1];if(!loc)fail('invalid_sitemap');
  return [normalized(decode(loc)),match[1].match(/<lastmod>(.*?)<\/lastmod>/s)?.[1]||null];
 }));
}
export function verifyDiscoveryPage({status,html,robotsHeader},url,indexable){
 if(status!==200)fail('page_unavailable');
 const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attributes(m[0]));
 const noindex=[robotsHeader||'',...tags.filter(t=>/^(robots|googlebot)$/i.test(t.name||'')).map(t=>t.content||'')].some(value=>/\b(noindex|none)\b/i.test(value));
 if(indexable===noindex)fail(indexable?'page_not_indexable':'page_should_be_excluded');
 const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attributes(m[0])).find(t=>(t.rel||'').toLowerCase()==='canonical')?.href;
 if(!canonical||normalized(canonical)!==normalized(url))fail('canonical_mismatch');
}
export async function readDiscoveryPublic(path,fetcher=fetch){
 const url=new URL(path,ORIGIN);if(url.origin!==ORIGIN)fail('unsafe_destination');
 const response=await fetcher(new Request(url,{redirect:'manual',cache:'no-store',headers:{'Cache-Control':'no-cache','User-Agent':'Musiclub-Publication-Check/1.0'},signal:AbortSignal.timeout(20000)}));
 return {status:response.status,html:await response.text(),robotsHeader:response.headers.get('x-robots-tag')};
}
// Durable jobs come from database review triggers, not a browser acknowledgement.
// One fresh catalogue and three public sitemaps are shared across the whole batch.
export async function processSearchDiscovery(db,{refresh,invalidate=()=>{},readPublic=readDiscoveryPublic,limit=5}={}){
 const claim=await db.rpc('musiclub_claim_search_discovery',{p_limit:limit});if(claim.error)throw new Error('discovery_claim_failed');
 const jobs=claim.data||[],result={claimed:jobs.length,verified:0,retry:0,deferred:0};if(!jobs.length)return result;
 let catalog,sitemaps,batchError;
 try{
  catalog=await refresh();
  const paths=new Set(['/catalogo','/reviews','/sitemap-reviews.xml','/sitemap-artists.xml','/sitemap-catalog.xml']);
  for(const job of jobs){const album=catalog.albums.find(a=>(a.edition_member_ids||[a.id]).includes(job.album_id));const path=album&&identity.releasePath(album);if(path){paths.add(path);paths.add('/albumes/'+path.split('/').at(-1));paths.add('/artista/'+identity.slugify(album.artist_name));for(const genre of album.genres||[]){const g=genreRoutes.genrePath(genre);if(g)paths.add(g);}}}
  await invalidate([...paths]);
  sitemaps=Object.fromEntries(await Promise.all(['reviews','artists','catalog'].map(async section=>{const response=await readPublic('/sitemap-'+section+'.xml');if(response.status!==200)fail('sitemap_unavailable');return [section,parseDiscoverySitemap(response.html)];})));
 }catch(error){batchError=error.code||'refresh_failed';}
 const groups=catalog&&sitemapData.buildSitemapGroups(catalog.albums,catalog.reviews),pageReads=new Map();
 for(const job of jobs){
  let url=null,kind=null,error=batchError;
  if(!error)try{
   const album=catalog.albums.find(a=>(a.edition_member_ids||[a.id]).includes(job.album_id));if(!album)fail('release_missing');
   if(!(Date.parse(album.public_content_updated_at)>=Date.parse(job.changed_at)))fail('catalogue_stale');
   const path=identity.releasePath(album);if(!path)fail('invalid_release_identity');url=normalized(path);
   const indexable=album.review_count>0;kind=indexable?'listed':'excluded';
   if(sitemaps.reviews.has(url)!==indexable)fail('sitemap_membership_mismatch');
   if(indexable){
    if(!(Date.parse(sitemaps.reviews.get(url))>=Date.parse(job.changed_at)))fail('sitemap_date_stale');
    const artist=normalized('/artista/'+identity.slugify(album.artist_name));if(!sitemaps.artists.has(artist))fail('artist_missing_from_sitemap');
    for(const genre of album.genres||[]){const path=genreRoutes.genrePath(genre);if(path&&groups.catalog.some(row=>row.loc===ORIGIN+path)&&!sitemaps.catalog.has(normalized(path)))fail('genre_missing_from_sitemap');}
   }
   if(!pageReads.has(path))pageReads.set(path,readPublic(path));
   verifyDiscoveryPage(await pageReads.get(path),url,indexable);
  }catch(cause){error=cause.code||'verification_failed';}
  const completed=await db.rpc('musiclub_complete_search_discovery',{p_album:job.album_id,p_revision:job.revision,p_lease:job.lease_token,p_ok:!error,p_url:url,p_kind:kind,p_error:error||null});
  if(completed.error)throw new Error('discovery_completion_failed');
  if(error)result.retry++;else if(completed.data)result.verified++;else result.deferred++;
 }
 return result;
}
