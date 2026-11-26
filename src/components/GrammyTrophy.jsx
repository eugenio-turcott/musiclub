import {GenreArtwork} from './GenreArtwork';
import {UiIcon} from './UiIcon';
import styles from './GrammyTrophy.module.css';

export function GrammyTrophy({className=''}){
 return <div className={`${styles.art} ${className}`} aria-hidden="true"><GenreArtwork genre="Pop" size={340} animated/><div className={styles.medallion}><UiIcon name="gramophone" tone="preserve"/></div></div>;
}
