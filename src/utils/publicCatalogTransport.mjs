const relation=album=>Object.fromEntries(['id','album_name','artist_name','image_url','release_type','release_year','tracks'].filter(key=>album[key]!==undefined).map(key=>[key,album[key]]));

// The complete tracklist travels once per release, rather than once per review.
export function compactCatalogTransport(data){
  return {...data,transport:'catalog-v1',reviews:data.reviews.map(({albums,...review})=>review)};
}
export function restoreCatalogTransport(data){
  if(data?.transport!=='catalog-v1')return data;
  const {transport,...catalog}=data;
  const byId=new Map(catalog.albums.flatMap(album=>(album.edition_member_ids||[album.id]).map(id=>[id,album])));
  return {...catalog,reviews:catalog.reviews.map(review=>({...review,albums:byId.has(review.album_id)?{...relation(byId.get(review.album_id)),id:review.album_id}:null}))};
}
