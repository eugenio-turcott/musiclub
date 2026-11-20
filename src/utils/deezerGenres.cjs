const {normalizeGenres} = require('./genreCatalog.cjs');

// Deezer localizes names using the request language. IDs stay stable across
// languages; only map verified musical categories, never guess from a country.
const byId = {
  132:['Pop'],116:['Hip-Hop'],122:['Reggaetón'],152:['Rock'],113:['Dance'],
  165:['R&B'],85:['Alternativo'],106:['Electrónica'],466:['Folk'],144:['Reggae'],
  129:['Jazz'],84:['Country'],67:['Salsa'],65:['Regional Mexicano'],98:['Clásica'],
  173:['Soundtrack'],464:['Metal'],169:['Soul','Funk'],153:['Blues'],71:['Cumbia'],
  95:["Children's Music"],197:['Latino'],186:['Música Cristiana'],2:['Música Africana'],
  16:['Música Asiática'],75:['Música Brasileña'],81:['Música India'],
};

function normalizeDeezerGenres(album={}) {
  const items=Array.isArray(album.genres?.data)?album.genres.data:[];
  const genres=items.flatMap(item=>{
    const named=normalizeGenres([item.name]);
    return named.length?named:byId[item.id]||[];
  });
  return normalizeGenres(genres.length?genres:byId[album.genre_id]||[]);
}
module.exports={normalizeDeezerGenres};
