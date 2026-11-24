function artistRefreshBatch(names,stored,{selected=[],limit=120,now=Date.now()}={}){
 const bySlug=new Map(stored.map(row=>[row.slug,row]));
 const candidates=[...names].filter(([slug])=>{
  if(selected.length&&!selected.includes(slug))return false;
  const row=bySlug.get(slug);
  return (!row?.lease_until||Date.parse(row.lease_until)<=now)&&(!row?.refresh_after||Date.parse(row.refresh_after)<=now);
 }).sort(([a],[b])=>(Date.parse(bySlug.get(a)?.refresh_after)||0)-(Date.parse(bySlug.get(b)?.refresh_after)||0)||a.localeCompare(b));
 const count=Math.max(1,Math.min(250,Number(limit)||120));
 return {batch:candidates.slice(0,count),pending:candidates.length};
}
module.exports={artistRefreshBatch};
