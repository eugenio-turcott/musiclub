// Keep selected artist/release reads bounded without dropping reviews at PostgREST's row limit.
export async function readRelatedRows(db,table,fields,column,ids) {
  const rows=[];
  for(let start=0;start<ids.length;start+=100) {
    const selected=ids.slice(start,start+100);
    for(let from=0;;from+=1000) {
      const {data,error}=await db.from(table).select(fields).in(column,selected).order('id').range(from,from+999);
      if(error)throw new Error('No se pudo cargar la ficha pública');
      rows.push(...(data || []));
      if(!data || data.length<1000)break;
    }
  }
  return rows;
}
