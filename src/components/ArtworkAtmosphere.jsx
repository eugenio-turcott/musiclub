'use client';
import {useEffect,useState} from 'react';
import {browserArtworkPalette} from '../utils/artworkPaletteBrowser.mjs';
import styles from './ReleasePresentation.module.css';
export const artworkPageClass=styles.artworkPage;
export function ArtworkAtmosphere({colors=[],entity,id,imageUrl}){
 const [generated,setGenerated]=useState(null);
 const valid=colors.filter(c=>/^#[a-f0-9]{6}$/i.test(c)).slice(0,5);
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
 return <div aria-hidden="true" className={styles.atmosphere} style={Object.fromEntries(Array.from({length:5},(_,i)=>[`--art-${i}`,palette[i%palette.length]]))}/>;
}
