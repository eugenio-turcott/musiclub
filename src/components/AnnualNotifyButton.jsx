'use client';
import {useEffect,useRef,useState} from 'react';
import {useAuth} from '../hooks/useAuth';
import {authenticatedFetch} from '../services/authenticatedFetch';
import {UiIcon} from './UiIcon';
import {ANNUAL_LAUNCH} from '../data/annual2026Launch.mjs';
import styles from './AnnualNotifyButton.module.css';
export function AnnualNotifyButton(){
 const auth=useAuth(),[subscribed,setSubscribed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),viewer=useRef(null);
 viewer.current=auth.user?.id||null;
 useEffect(()=>{let active=true;setSubscribed(false);setError('');setBusy(false);if(!auth.user?.id)return;setBusy(true);authenticatedFetch('/api/annual/2026/notifications').then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error);if(active)setSubscribed(body.subscribed);}).catch(()=>{if(active)setError('No pudimos consultar tu aviso. Puedes reintentarlo.');}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[auth.user?.id]);
 const toggle=async()=>{if(!auth.user){auth.loginWithGoogle();return;}const account=auth.user.id;setBusy(true);setError('');try{const r=await authenticatedFetch('/api/annual/2026/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:!subscribed})});const body=await r.json();if(!r.ok)throw Error(body.error);if(viewer.current===account)setSubscribed(body.subscribed);}catch(e){if(viewer.current===account)setError(e.message||'No se pudo guardar tu aviso.');}finally{if(viewer.current===account)setBusy(false);}};
 return <div className={styles.notify}><button type="button" data-annual-icons="light" disabled={busy||auth.loading} aria-pressed={subscribed} onClick={toggle}><UiIcon name={subscribed?'check':'bell'} size={24} tone="inherit"/>{busy?'Guardando…':subscribed?'Aviso guardado':'Notificarme'}<UiIcon name="arrow" size={22} tone="inherit"/></button><p>{subscribed?'Te avisaremos al correo de tu cuenta cuando abra tu edición.':`${ANNUAL_LAUNCH.dateLabel} · ${ANNUAL_LAUNCH.timeLabel} · Ciudad de México`}</p>{subscribed&&<button type="button" className={styles.cancel} disabled={busy} onClick={toggle}>Cancelar aviso</button>}{error&&<p role="alert">{error}</p>}</div>;
}
