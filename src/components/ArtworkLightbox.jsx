'use client';
import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {UiIcon} from './UiIcon';
export function ArtworkLightbox({open,onClose,src,title,artist,closeLabel='Cerrar imagen'}){
 const dialog=useRef(null);
 useEffect(()=>{
  if(!open)return;const focus=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.querySelector('button')?.focus();
  const key=event=>{if(event.key==='Escape'){event.preventDefault();onClose();}if(event.key==='Tab'){event.preventDefault();dialog.current?.querySelector('button')?.focus();}};
  document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);if(focus?.isConnected)focus.focus();};
 },[open,onClose]);
 if(!open)return null;
 return createPortal(<div ref={dialog} className="artwork-lightbox" role="dialog" aria-modal="true" aria-label={`Portada de ${title}`} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><button type="button" aria-label={closeLabel} onClick={onClose}><UiIcon name="close" size={26}/></button><figure><img src={src} alt={title}/><figcaption><strong>{title}</strong>{artist&&<span>{artist}</span>}</figcaption></figure></div>,document.body);
}
