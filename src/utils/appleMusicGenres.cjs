const catalog=require('./genreCatalog.cjs');
const snapshot=require('../data/appleMusicGenreMap.json');
const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const byName=new Map(Object.values(snapshot.categories).map(category=>[key(category.name),category.genres]));
function normalizeAppleGenres(item={}){
 const values=[...(item.genreIds||[]),item.primaryGenreId].filter(Boolean);
 const genres=values.flatMap(id=>snapshot.categories[String(id)]?.genres||[]);
 const name=item.primaryGenreName;
 return catalog.normalizeGenres([...genres,...(byName.get(key(name))||catalog.normalizeGenres([name]))]);
}
module.exports={normalizeAppleGenres};
