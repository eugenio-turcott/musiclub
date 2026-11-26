import {UiIcon} from './UiIcon';
import {GenreLabel} from './GenreLabel';
import {GenreArtwork} from './GenreArtwork';
import styles from './ArtistHero.module.css';
export function ArtistHero({artist,stats,releaseCount}){
 return <section className={styles.hero} aria-label={`Perfil de ${artist.name}`}>
  {artist.image&&<img className={styles.backdrop} src={artist.image} alt="" aria-hidden="true"/>}
  <div className={styles.vinyl} aria-hidden="true"><GenreArtwork genre={artist.genres?.[0]||'Pop'} animated size={300}/></div>
  <div className={styles.portrait}><img src={artist.image||'/musiclub_logo_corchea.png'} alt={artist.name}/></div>
  <div className={styles.info}><div className={styles.eyebrow}><img src="/musiclub_logo_corchea.png" alt=""/> ARTISTAS EN MUSICLUB</div>
   <h1 translate="no">{artist.name}</h1><p>{releaseCount} {releaseCount===1?'release para explorar':'releases para explorar'}.</p>
   <div className={styles.details}><div className={styles.genres}>{artist.genres?.slice(0,6).map(g=><GenreLabel key={g} genre={g} link size={24}/>)}</div>
   <dl className={styles.stats}><div><UiIcon name="disc"/><dt>En el club</dt><dd>{stats.total}</dd></div><div><UiIcon name="review"/><dt>Reseñas</dt><dd>{stats.totalReviews}</dd></div><div><UiIcon name="star"/><dt>Nota del club</dt><dd>{stats.avgRating||'—'}</dd></div></dl>
   {artist.spotifyUrl&&<a className={styles.listen} href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">Abrir artista en Spotify <UiIcon name="arrow" size={22}/></a>}
  </div></div>
 </section>;
}
