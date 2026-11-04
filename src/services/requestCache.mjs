// Short-lived, in-memory reads. Callers include the account in private keys.
// Invalidating a key also prevents an older pending read from refilling it.
export function createRequestCache({ttl=60000,maxEntries=32,now=Date.now}={}) {
  const entries=new Map();
  const peek=key=>{
    const entry=entries.get(key);
    return entry?.data !== undefined && now()-entry.savedAt<ttl ? entry.data : undefined;
  };
  async function read(key,load) {
    const recent=peek(key);
    if(recent!==undefined)return recent;
    if(entries.get(key)?.pending)return entries.get(key).pending;
    if(entries.size>=maxEntries&&!entries.has(key))entries.delete(entries.keys().next().value);
    const entry={};
    entries.set(key,entry);
    entry.pending=Promise.resolve().then(load).then(data=>{
      if(entries.get(key)===entry){entry.data=data;entry.savedAt=now();}
      return data;
    }).finally(()=>{if(entries.get(key)===entry){delete entry.pending;if(entry.data===undefined)entries.delete(key);}});
    return entry.pending;
  }
  return {peek,read,invalidate(key){entries.delete(key);},clear(){entries.clear();}};
}
