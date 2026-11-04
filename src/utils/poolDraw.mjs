// Preserve the Pool's modest age weighting without repeated draws or network reads.
export function choosePoolWinner(pool, random=Math.random, now=Date.now()) {
  if(!pool.length)return null;
  const dates=pool.map(a=>Number.isFinite(Date.parse(a.created_at))?Date.parse(a.created_at):now);
  const oldest=Math.min(...dates),newest=Math.max(...dates),range=newest-oldest;
  const weights=dates.map(date=>1+(range?0.4*(newest-date)/range:0));
  let ticket=Math.min(1-Number.EPSILON,Math.max(0,random()))*weights.reduce((a,b)=>a+b,0);
  return pool[weights.findIndex(weight=>(ticket-=weight)<0)] || pool.at(-1);
}
