"use client";
import {useEffect,useState} from 'react';
import {GenreArtwork} from './GenreArtwork';
const genres=['Pop','Rock','Jazz','Soul','Indie','Hip-Hop','Electrónica','Folk','Alternativo'];
export function DetailLoading({label='Preparando la próxima escucha…',fullScreen=true}) {
  const [design,setDesign]=useState({genre:'Pop',edition:0});
  useEffect(()=>{const values=crypto.getRandomValues(new Uint32Array(2));setDesign({genre:genres[values[0]%genres.length],edition:values[1]%48});},[]);
  return <div data-vinyl-loading="" role="status" aria-live="polite" aria-busy="true" style={{minHeight:fullScreen?'100svh':'20rem'}} className={`${fullScreen?'cyber-grid':''} flex w-full flex-col items-center justify-center gap-8 px-6 py-12 text-center text-white`}>
    <div className="relative" style={{width:'min(64vw,300px)'}}><div className="absolute inset-8 rounded-full bg-purple-400/15 blur-3xl"/><GenreArtwork genre={design.genre} edition={design.edition} animated size={320} className="relative h-auto w-full drop-shadow-[0_18px_35px_#0008]"/></div>
    <div><p className="text-lg font-black tracking-tight text-white sm:text-xl">{label}</p><span aria-hidden="true" className="mt-5 inline-flex gap-2">{[0,1,2].map(i=><i key={i} className="h-1.5 w-1.5 rounded-full bg-pink-300 motion-safe:animate-pulse" style={{animationDelay:`${i*.2}s`}}/>)}</span></div>
  </div>;
}
