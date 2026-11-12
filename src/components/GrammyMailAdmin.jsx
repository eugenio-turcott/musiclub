'use client';
import {useState} from 'react';
import {authenticatedFetch} from '../services/authenticatedFetch';
import {UiIcon} from './UiIcon';
export function GrammyMailAdmin(){
 const [opened,setOpened]=useState(false),[status,setStatus]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 async function refresh(){const response=await authenticatedFetch('/api/grammys/confirmations');const data=await response.json();if(!response.ok)throw new Error(data.error);setStatus(data);}
 async function check(){setBusy(true);setNotice('');try{await refresh();}catch{setNotice('No se pudo consultar el estado.');}finally{setBusy(false);}}
 async function send(){setBusy(true);setNotice('');try{
  const response=await authenticatedFetch('/api/grammys/confirmations',{method:'POST'}),data=await response.json();if(!response.ok)throw new Error(data.error);
  setNotice(`${data.sent} confirmaciones aceptadas por el proveedor. ${data.failed||0} envíos requieren revisión.${data.recordingWarnings?' Hay registros por completar; no repitas esos envíos.':''}`);await refresh();
 }catch{setNotice('No se confirmó el resultado del lote. Consulta el estado antes de volver a intentar.');}finally{setBusy(false);}}
 return <details className="grammy-mail-admin" onToggle={event=>{if(event.currentTarget.open&&!opened){setOpened(true);check();}}}><summary><UiIcon name="mail"/>Correos de Grammy 2027</summary><p>Confirmación al activar · Recordatorio: domingo 15 de noviembre, 7:00 p. m. CDMX. Sólo personas con la suscripción activa.</p>{status&&<p role="status">Suscriptores activos: {status.subscribers} · Confirmaciones enviadas: {status.confirmed} · Pendientes: {status.pending} · Por revisar: {status.reviewRequired} · Recordatorios enviados: {status.remindersSent}</p>}<button type="button" disabled={busy} onClick={check}>Consultar estado</button><button type="button" disabled={busy||!status?.pending} onClick={send}>{busy?'Procesando…':'Enviar confirmaciones pendientes'}</button>{notice&&<p role="status">{notice}</p>}</details>;
}
