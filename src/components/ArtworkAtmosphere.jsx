'use client';
import {useEffect,useRef,useState} from 'react';
import {browserArtworkPalette} from '../utils/artworkPaletteBrowser.mjs';
import styles from './ReleasePresentation.module.css';
export const artworkPageClass=styles.artworkPage;
export function ArtworkAtmosphere({colors=[],entity,id,imageUrl}){
 const boundary=useRef(null);
 const [generated,setGenerated]=useState(null);
 const valid=colors.filter(c=>/^#[a-f0-9]{6}$/i.test(c)).slice(0,5);
 useEffect(()=>{
  const element=boundary.current;if(!element)return;
  const page=element.parentElement,marker=page.querySelector('[data-artwork-start]');let frame=0;
  const draw=()=>{frame=0;const navigation=document.querySelector('[data-site-navigation]');const top=Math.max(0,marker?.getBoundingClientRect().top||0,navigation?.getBoundingClientRect().bottom||0);element.style.setProperty('--artwork-cutoff',`${Math.min(innerHeight,top)}px`);};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
  const resize=new ResizeObserver(schedule);if(marker)resize.observe(marker);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);draw();
  return()=>{resize.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[entity,id,valid.length,generated]);
 useEffect(()=>{
  setGenerated(null);if(valid.length||!entity||!id||!imageUrl)return;
  const controller=new AbortController();
  (async()=>{
   let data;
   try{const response=await fetch(`/api/artwork-palette?entity=${entity}&id=${encodeURIComponent(id)}`,{signal:controller.signal});if(response.ok)data=await response.json();}catch{}
   if(controller.signal.aborted)return;
   if(data?.image_url===imageUrl&&data.colors?.length){setGenerated(data);return;}
   try{const colors=await browserArtworkPalette(imageUrl,controller.signal);if(!controller.signal.aborted)setGenerated({colors,image_url:imageUrl});}catch{}
  })();
  return()=>controller.abort();
 },[entity,id,imageUrl,valid.join(',')]);
 const palette=valid.length?valid:generated?.image_url===imageUrl?(generated.colors||[]).filter(c=>/^#[a-f0-9]{6}$/i.test(c)).slice(0,5):[];
 if(!palette.length)return null;
 return <div ref={boundary} aria-hidden="true" className={styles.artworkBoundary} data-artwork-boundary style={Object.fromEntries(Array.from({length:5},(_,i)=>[`--art-${i}`,palette[i%palette.length]]))}><div className={styles.atmosphere}/></div>;
}
