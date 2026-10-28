import { InterfaceText } from './UiIcon';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function reviewDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'America/Mexico_City' }).format(new Date(`${value}T12:00:00Z`));
}

export function WinnerReviewSchedule({ winner, canManage, onSave }) {
  const [date, setDate] = useState(winner.review_scheduled_for || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setDate(winner.review_scheduled_for || ''); setMessage(''); }, [winner.id, winner.review_scheduled_for]);
  return <div className="mt-4 rounded-2xl border border-pink-400/20 bg-pink-400/5 p-3 text-left">
    <p className="text-sm font-bold text-pink-200"><InterfaceText>{"🗓️ Fecha de reseña: "}</InterfaceText>{reviewDate(winner.review_scheduled_for)}</p>
    <p className="mt-1 text-xs text-slate-400">{winner.reviews_enabled ? 'Reseñas habilitadas para la sala.' : 'La apertura de reseñas la decide quien administra el Pool.'}</p>
    {canManage && <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage('');
      try { await onSave(winner.id, date || null); setMessage('Fecha guardada. La apertura sigue siendo manual.'); }
      catch (error) { setMessage(error.message || 'No se pudo guardar la fecha.'); }
      finally { setBusy(false); }
    }}>
      <label className="text-xs text-slate-300">Programar fecha de reseña
        <input type="date" value={date} disabled={busy} onChange={event=>setDate(event.target.value)} className="mt-1 block rounded-xl border border-white/20 bg-[#151526] px-3 py-2 text-sm text-white scheme-dark"/>
      </label>
      <button disabled={busy} className="rounded-xl bg-pink-500/20 border border-pink-400/30 px-3 py-2 text-xs font-bold text-pink-200 disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar fecha'}</button>
      <span className="text-[11px] text-slate-400">Deja la fecha vacía para quitarla.</span>
    </form>}
    {message && <p role="status" className="mt-2 text-xs text-pink-200">{message}</p>}
  </div>;
}

export function PoolReviewNotice({ pools = [] }) {
  if (!pools.length) return null;
  return <div className="space-y-2" aria-label="Reseñas en tus Pools">{pools.map(pool=><div key={pool.entry_id} className="rounded-xl border border-pink-400/20 bg-pink-400/5 px-4 py-3 text-xs text-slate-300">
    <p className="font-bold text-pink-200">{pool.pool_name} · {pool.room_name}</p>
    <p className="mt-1">{pool.status === 'GANADOR' ? `Fecha de reseña: ${reviewDate(pool.review_scheduled_for)}` : 'Este release sigue participando en el Pool.'}</p>
    {pool.blocked && <p className="mt-1 text-slate-400">{pool.status === 'GANADOR' ? 'Las reseñas del ganador aún no están habilitadas en esta sala.' : 'La escucha del Pool todavía está en curso.'} Puedes confirmar si deseas reseñar antes.</p>}
  </div>)}</div>;
}

export function EarlyPoolReviewDialog({ pools, onConfirm, onClose }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element=dialog.current; element.showModal(); return ()=>element.close(); }, []);
  return createPortal(<dialog ref={dialog} aria-labelledby="early-pool-title" onCancel={event=>{event.preventDefault(); if (!busy) onClose();}} className="m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-3xl border border-pink-400/30 bg-[#151426] p-6 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm">
    <span className="text-3xl" aria-hidden="true"><InterfaceText>{"🎧"}</InterfaceText></span>
    <h2 id="early-pool-title" className="mt-3 text-2xl font-black">¿Reseñar antes de la apertura del Pool?</h2>
    <p className="mt-3 text-sm text-slate-300">Este release forma parte de tus Pools. La escucha compartida aún está pendiente:</p>
    <div className="my-4 space-y-3">{pools.filter(pool=>pool.blocked).map(pool=><div key={pool.entry_id} className="rounded-xl bg-white/5 p-3 text-sm"><p className="font-bold text-pink-200">{pool.pool_name}</p><p className="text-xs text-slate-400">{pool.room_name}</p><p className="mt-1">{pool.status==='GANADOR' ? `Fecha de reseña: ${reviewDate(pool.review_scheduled_for)}` : 'Propuesta activa · Todavía no es un ganador pasado'}</p></div>)}</div>
    <p className="text-sm text-slate-300">Tu reseña será pública. Continuar es una decisión personal y mantiene cerrada la apertura de reseñas para el resto del Pool.</p>
    {error && <p role="alert" className="mt-3 text-sm text-amber-300">{error}</p>}
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <button autoFocus disabled={busy} onClick={onClose} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold">Esperar al Pool</button>
      <button disabled={busy || !pools.some(pool=>pool.blocked)} onClick={async()=>{setBusy(true);setError('');try { await onConfirm(); } catch(e) {setError(e.message);}finally {setBusy(false);}}} className="rounded-xl bg-pink-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Confirmando…' : 'Reseñar de todos modos'}</button>
    </div>
  </dialog>, document.body);
}
