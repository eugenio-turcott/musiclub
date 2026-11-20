import genres from './genreCatalog.cjs';

// Musiclub's first edition starts with the club's creation in July 2026.
export const annualClubMonths=(months=[])=>months.filter(m=>m.month>=7&&m.month<=12);

export function annualPersonalRankingCopy(total=0,name=''){
  const count=Math.max(0,Math.floor(Number(total)||0)),greeting=name.trim()?`${name.trim()}, `:'';
  if(!count)return {title:'Tu ranking personal',subtitle:'Álbumes publicados en 2026',message:`${greeting}todavía no has reseñado álbumes de 2026. Tu primera reseña abrirá esta lista.`};
  if(count===1)return {title:'Tu único álbum de 2026',subtitle:'Un álbum · Tu propia nota',message:`${greeting}reseñaste un álbum de este año. Tiene un lugar para él solo en tu 2026.`};
  if(count<=5)return {title:`Tus ${count} álbumes de 2026`,subtitle:'Una lista corta · Tus propias notas',message:`${greeting}reseñaste ${count} álbumes de este año. Poquitos, con una opinión tuya en cada uno.`};
  if(count<20)return {title:`Tu top ${count} de 2026`,subtitle:'Ordenado por tus calificaciones',message:`${greeting}estos son los ${count} álbumes de este año que reseñaste, de tu menor nota a tu favorita.`};
  return {title:'Tu top 20 de 2026',subtitle:'Tus 20 mejores notas del año',message:count===20?`${greeting}20 álbumes de este año y 20 opiniones tuyas. Este es tu ranking.`:`${greeting}reseñaste ${count} álbumes de este año. Aquí están los 20 que mejor calificaste.`};
}

export function annualReleaseDate(release){
  if(/^\d{4}-\d{2}-\d{2}$/.test(release.releaseDate||''))return release.releaseDate;
  return `${release.year||2026}-${release.month?String(release.month).padStart(2,'0'):'99'}-99`;
}
export function annualGenreGroups(selection=[]){
  const groups=new Map();
  for(const release of selection){
    const genre=genres.normalizeGenres([release.genre])[0]||release.genre||'Otros géneros';
    const key=genres.genreKey(genre)||genre.toLowerCase();
    if(!groups.has(key))groups.set(key,{key,genre,releases:[]});
    groups.get(key).releases.push(release);
  }
  return [...groups.values()].sort((a,b)=>a.genre.localeCompare(b.genre,'es')).map(group=>({...group,releases:group.releases.sort((a,b)=>annualReleaseDate(a).localeCompare(annualReleaseDate(b))||a.title.localeCompare(b.title,'es'))}));
}
export function annualReleaseDateLabel(release){
  if(/^\d{4}-\d{2}-\d{2}$/.test(release.releaseDate||''))return new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${release.releaseDate}T12:00:00Z`));
  return release.month?new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(release.year||2026,release.month-1,1))):String(release.year||2026);
}
