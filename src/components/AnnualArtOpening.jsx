'use client';
import {useState} from 'react';
import {createPortal} from 'react-dom';
import {UiIcon} from './UiIcon';
import {useDialogFocus} from '../hooks/useDialogFocus';
import {ANNUAL_ART as pieces} from '../data/annual2026Art.mjs';
import styles from '../views/AnnualPage.module.css';

// Each release belongs to one band; all fifteen appear without repeats between rows.
const rows=Array.from({length:3},(_,row)=>pieces.map((_,i)=>i).filter(i=>i%3===row));
function ArtDetail({index,onClose,onSelect}){
  const ref=useDialogFocus(true,onClose),piece=pieces[index];
  return createPortal(<div className={styles.artLightbox} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} role="dialog" aria-modal="true" aria-label="Ilustraciones de Musiclub 2026"><div className={styles.artLightboxTools}><span>Musiclub · Edición 2026</span><a href={piece.download} download={`${piece.id}-musiclub-2026.png`} aria-label="Descargar ilustración PNG"><UiIcon name="download"/></a><button type="button" onClick={onClose} aria-label="Cerrar ilustración"><UiIcon name="close"/></button></div><img src={piece.detailSrc} alt={piece.description} width="1200" height="1200"/><div className={styles.artLightboxFoot}><button type="button" aria-label="Ilustración anterior" onClick={()=>onSelect((index+pieces.length-1)%pieces.length)}><UiIcon name="arrowLeft"/></button><p><strong>{piece.title}</strong><span>{piece.artist}</span></p><button type="button" aria-label="Siguiente ilustración" onClick={()=>onSelect((index+1)%pieces.length)}><UiIcon name="arrow"/></button></div></section></div>,document.body);
}
export function AnnualArtOpening({next='adelanto'}){
  const [selected,setSelected]=useState(null);
  return <section id="inicio" data-annual-scene data-annual-reveal className={styles.artOpening} aria-label="Mural artístico de Musiclub 2026" data-gallery-open={selected!==null}>
    <h1 className={styles.artAccessibleTitle}>Musiclub 2026 · Nuestro año en música</h1>
    <div className={styles.artBands}>{rows.map((row,c)=><div key={c} className={styles.artBand}><div className={styles.artBandTrack}>{[0,1].map(copy=><div key={copy} className={styles.artBandRun} aria-hidden={copy===1?true:undefined}>{row.map((i,k)=>{const piece=pieces[i];return <button key={piece.id} type="button" className={styles.releaseArtTile} data-release-id={piece.id} tabIndex={copy===1?-1:0} aria-label={`Ver ilustración: ${piece.title}`} onClick={()=>setSelected(i)}><img src={piece.src} alt="" width="600" height="600" loading={copy===0&&k<5?'eager':'lazy'} draggable="false"/></button>;})}</div>)}</div></div>)}</div>
    <a href={`#${next}`} className={styles.artContinue} aria-label={next==='adelanto'?'Continuar al adelanto':'Continuar a los releases'}><UiIcon name="arrowDown"/></a>
    {selected!==null&&<ArtDetail index={selected} onSelect={setSelected} onClose={()=>setSelected(null)}/>}
  </section>;
}
