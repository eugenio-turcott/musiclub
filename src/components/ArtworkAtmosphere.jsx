import styles from './ReleasePresentation.module.css';
export const artworkPageClass=styles.artworkPage;
export function ArtworkAtmosphere({colors=[]}){
 const palette=colors.filter(c=>/^#[a-f0-9]{6}$/i.test(c)).slice(0,5);
 if(!palette.length)return null;
 return <div aria-hidden="true" className={styles.atmosphere} style={Object.fromEntries(Array.from({length:5},(_,i)=>[`--art-${i}`,palette[i%palette.length]]))}/>;
}
