'use client';
import {useState} from 'react';
import {createPortal} from 'react-dom';
import {UiIcon} from './UiIcon';
import {useDialogFocus} from '../hooks/useDialogFocus';
import styles from '../views/AnnualPage.module.css';

const pieces=[
  ['tormenta','Ventana de tormenta, manos y cinta de seda',560],
  ['gato','Un gato entre libros y plantas',560],
  ['montana','Montañas y cuatro caminantes',640],
  ['teatro','Un escenario con cortinas',620],
  ['silla','Una silla vacía con flores',520],
  ['flores','Una radio de la que crecen flores',520],
  ['arbol','Un árbol de ramas grabadas',640],
  ['carta','Una carta, un corazón y una cinta',520],
  ['vinilo','Un vinilo entre estrellas',560],
];
const columns=[[0,8,7,2,6],[1,4,5,3],[2,6,0],[3,7,1]];
const src=id=>`/annual/2026/art/${id}.svg`;
function ArtDetail({index,onClose,onSelect}){
  const ref=useDialogFocus(true,onClose),[id,title,height]=pieces[index];
  return createPortal(<div className={styles.artLightbox} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} role="dialog" aria-modal="true" aria-label="Ilustraciones de Musiclub 2026"><div className={styles.artLightboxTools}><span>Musiclub · Edición 2026</span><a href={src(id)} download={`${id}-musiclub-2026.svg`} aria-label="Descargar ilustración SVG"><UiIcon name="download"/></a><button type="button" onClick={onClose} aria-label="Cerrar ilustración"><UiIcon name="close"/></button></div><img src={src(id)} alt={title} width="440" height={height}/><div className={styles.artLightboxFoot}><button type="button" aria-label="Ilustración anterior" onClick={()=>onSelect((index+pieces.length-1)%pieces.length)}><UiIcon name="arrowLeft"/></button><p>{title}</p><button type="button" aria-label="Siguiente ilustración" onClick={()=>onSelect((index+1)%pieces.length)}><UiIcon name="arrow"/></button></div></section></div>,document.body);
}
export function AnnualArtOpening({next='adelanto'}){
  const [selected,setSelected]=useState(null);
  return <section id="inicio" data-annual-scene data-annual-reveal className={styles.artOpening} aria-label="Mural artístico de Musiclub 2026" data-gallery-open={selected!==null}>
    <h1 className={styles.artAccessibleTitle}>Musiclub 2026 · Nuestro año en música</h1>
    <div className={styles.muralColumns}>{columns.map((column,c)=><div key={c} className={styles.muralColumn}><div className={styles.muralStrip}>{[0,1].map(copy=><div key={copy} className={styles.muralRun} aria-hidden={copy===1?true:undefined}>{column.map((i,k)=>{const [id,title,height]=pieces[i];return <button key={`${id}-${k}`} type="button" className={styles.artPrint} style={{'--paper-turn':`${[-1,.7,-.4,1][(i+c)%4]}deg`}} tabIndex={copy===1?-1:0} aria-label={`Ver ilustración: ${title}`} onClick={()=>setSelected(i)}><img src={src(id)} alt="" width="440" height={height} loading={copy===0&&k<2?'eager':'lazy'} draggable="false"/></button>;})}</div>)}</div></div>)}</div>
    <a href={`#${next}`} className={styles.artContinue} aria-label={next==='adelanto'?'Continuar al adelanto':'Continuar a los releases'}><UiIcon name="arrowDown"/></a>
    {selected!==null&&<ArtDetail index={selected} onSelect={setSelected} onClose={()=>setSelected(null)}/>}
  </section>;
}
