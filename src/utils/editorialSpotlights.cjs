function activeSpotlights(items,now=Date.now()) {
  return items.filter(item=>{
    const start=item.startsAt?Date.parse(item.startsAt):null,end=item.endsAt?Date.parse(item.endsAt):null;
    if((start!==null&&!Number.isFinite(start))||(end!==null&&!Number.isFinite(end)))return false;
    if(item.placement==='sponsored' && (start===null || end===null || end<=start || end-start>7*86400000))return false;
    return (start===null||now>=start)&&(end===null||now<end);
  });
}
module.exports={activeSpotlights};
