"use client";
import {useEffect,useState} from 'react';
import {GenreArtwork} from './GenreArtwork';
const genres=['Pop','Rock','Jazz','Soul','Indie','Hip-Hop','Electrónica','Folk','Alternativo'];
export function DetailLoading({label='Preparando la próxima escucha…',fullScreen=false}) {
  const [design,setDesign]=useState({genre:'Pop',edition:0});
  useEffect(()=>{const values=crypto.getRandomValues(new Uint32Array(2));setDesign({genre:genres[values[0]%genres.length],edition:values[1]%48});},[]);
  return <div data-vinyl-loading="" role="status" aria-live="polite" aria-busy="true" className="section-loading-panel">
    <GenreArtwork genre={design.genre} edition={design.edition} animated size={48}/>
    <div><p>{label}</p><span className="section-loading-line" aria-hidden="true"/></div>
  </div>;
}
