import discs from '../utils/trackDiscs.cjs';
import {UiIcon} from './UiIcon';
import styles from './ReleasePresentation.module.css';
export function TrackDiscs({tracks=[],children,compact=false}){
 const sections=discs.trackDiscSections(tracks),multiple=sections.length>1;
 return <div className={compact?styles.discNavigation:styles.discs} data-track-discs={sections.length}>{sections.map(section=><section key={section.disc} aria-label={multiple?`Disco ${section.disc}`:'Canciones'}>
  {multiple&&<h4 className={styles.discHeading}><UiIcon name="disc" size={22}/><span>Disco {section.disc}</span><small>{section.tracks.length} canciones</small></h4>}
  <div className={compact?styles.discPills:styles.discTracks}>{section.tracks.map(track=>children(track,track.global_index))}</div>
 </section>)}</div>;
}
