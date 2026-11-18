import genres from './genreCatalog.cjs';

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
