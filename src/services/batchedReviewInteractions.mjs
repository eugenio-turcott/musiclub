import {createRequestCache} from './requestCache.mjs';

// Card effects in one render share two reads, even when they belong to different albums.
export function createInteractionLoader(load) {
  const cache=createRequestCache({ttl:60000,maxEntries:160});
  let queued=new Map(),scheduled=false;
  async function flush() {
    const batch=queued;queued=new Map();scheduled=false;
    try {
      const data=await load([...batch.keys()]);
      for(const [id,resolvers] of batch)for(const resolve of resolvers)resolve({
        reactions:(data?.reactions || []).filter(row=>String(row.review_id)===id),
        comments:(data?.comments || []).filter(row=>String(row.review_id)===id),
      });
    } catch(error) {for(const resolvers of batch.values())for(const resolve of resolvers)resolve(Promise.reject(error));}
  }
  return (reviewId,force=false)=>{
    const id=String(reviewId);
    if(force===true)cache.invalidate(id);
    return cache.read(id,()=>new Promise(resolve=>{
      queued.set(id,[...(queued.get(id)||[]),resolve]);
      if(!scheduled){scheduled=true;queueMicrotask(flush);}
    }));
  };
}
