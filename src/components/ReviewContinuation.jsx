'use client';
import {useEffect,useState} from 'react';
import {authenticatedFetch} from '../services/authenticatedFetch';
import {UiIcon} from './UiIcon';
export function ReviewContinuation({albumId,enabled,onApply}){
 const [item,setItem]=useState(null),[applied,setApplied]=useState(false);
 useEffect(()=>{let active=true;setItem(null);setApplied(false);if(enabled)authenticatedFetch(`/api/reviews/continuations?albumId=${encodeURIComponent(albumId)}`).then(r=>r.ok?r.json():null).then(data=>{if(active)setItem(data?.continuations?.[0]||null);}).catch(()=>{});return()=>{active=false;};},[albumId,enabled]);
 if(!item||applied)return null;
 return <aside className="review-continuation" aria-label="Tus canciones ya calificadas"><UiIcon name="tracks" size={32}/><div><strong>Ya calificaste {item.matchedTracks} canciones</strong><p>Coinciden con tu reseña de {item.sourceTitle}. Puedes usar esas notas y completar lo que falta.</p></div><button type="button" onClick={()=>{onApply(item.trackRatings);setApplied(true);}}>Usar mis calificaciones <UiIcon name="arrow" size={20}/></button></aside>;
}
