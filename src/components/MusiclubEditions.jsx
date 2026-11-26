import {Link} from 'react-router-dom';
import {GenreArtwork} from './GenreArtwork';
import {UiIcon} from './UiIcon';
import styles from './MusiclubEditions.module.css';
export function MusiclubEditions(){
 return <section className={styles.editions} aria-label="Las ediciones especiales de Musiclub">
  <Link to="/2026" className={styles.annual}><div><span>EL AÑO DEL CLUB</span><h2>Musiclub 2026.</h2><p>Lo que escuchamos. Lo que nos llevamos.</p><strong>Descubre el adelanto <UiIcon name="arrow" size={23}/></strong></div><div className={styles.year} aria-hidden="true"><b>20<br/><em>26</em></b><GenreArtwork genre="Pop" size={120} animated rotateLabel/></div></Link>
  <Link to="/grammys" className={styles.grammy}><div><span>TUS PREDICCIONES</span><h2>Grammy 2027.</h2><p>Escucha a los nominados y elige a tus favoritos.</p><strong>Escucha y predice <UiIcon name="arrow" size={23}/></strong></div><div className={styles.trophy} aria-hidden="true"><GenreArtwork genre="Jazz" size={165} animated/><i><UiIcon name="gramophone" size={70} tone="inherit"/></i></div></Link>
 </section>;
}
