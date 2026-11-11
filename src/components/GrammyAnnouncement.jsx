'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {UiIcon} from './UiIcon';
export function GrammyAnnouncement(){
 const [announced,setAnnounced]=useState(false),[ended,setEnded]=useState(false);
 useEffect(()=>{const now=Date.now();setAnnounced(now>=Date.parse('2026-11-16T12:45:00Z'));setEnded(now>=Date.parse('2027-02-08T12:00:00Z'));},[]);
 if(ended)return null;
 return <aside className="grammy-announcement" aria-label="Grammy 2027 en Musiclub"><Link href="/grammys"><UiIcon name="gramophone" tone="inherit"/><span><strong>GRAMMY 2027</strong><span>{announced?'Consulta los nominados y tus predicciones':'Nominaciones · 16 de noviembre'}</span><small>Escucha, califica y predice con el club.</small></span><b>Ver actividad <UiIcon name="arrow" tone="inherit"/></b></Link></aside>;
}
