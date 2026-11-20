const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();

export function browseGrammyCategories(categories,groups,fields,{field='general',query=''}={}){
  const search=fold(query),fieldNames=new Map(fields.map(item=>[item.id,item.title]));
  return categories.filter(category=>{
    if(search)return fold([category.name,category.english,fieldNames.get(category.field),...(groups[category.id]||[]).flatMap(n=>[n.title,n.artist])].join(' ')).includes(search);
    return field==='all'||(field==='new'?category.isNew:category.field===field);
  }).sort((a,b)=>a.order-b.order);
}
