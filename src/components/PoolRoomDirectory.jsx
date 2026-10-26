'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { poolRoomService, poolInviteToken } from '../services/poolRoomService';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { MusiclubVinyl } from './MusiclubVinyl';

const field = 'mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-[#15132d] p-3 text-white';
const button = 'min-h-12 rounded-xl bg-pink-400 px-5 py-3 text-sm font-black text-[#171433] disabled:opacity-50';

export function PoolRoomDirectory({ renderRoom }) {
  const { user, isAdmin, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const roomId = params.get('sala') || '';
  const invite = params.get('invitacion') || '';
  const [snapshot, setSnapshot] = useState({ userId: undefined, rooms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('public');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [invitation, setInvitation] = useState('');
  const identity = user?.id || null;
  const loadSequence = useRef(0);
  const rooms = snapshot.userId === identity ? snapshot.rooms : [];
  const refresh = useCallback(async () => {
    const request = ++loadSequence.current;
    setLoading(true); setError('');
    try { const next = await poolRoomService.list(identity); if (request === loadSequence.current) setSnapshot({ userId: identity, rooms: next }); }
    catch (err) { if (request === loadSequence.current) { setSnapshot({ userId: identity, rooms: [] }); setError(err.message); } }
    finally { if (request === loadSequence.current) setLoading(false); }
  }, [identity]);
  useEffect(() => { if (!authLoading) refresh(); }, [authLoading, refresh]);
  const run = async action => { setBusy(true); setError(''); try { await action(); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const open = id => navigate(`/pool?sala=${encodeURIComponent(id)}`);
  const selected = rooms.find(room => room.id === roomId);
  const ready = !authLoading && !loading && snapshot.userId === identity;
  if (ready && selected && !invite) return renderRoom(selected, { back: () => navigate('/pool'), refresh });
  const visible = rooms.filter(room => tab === 'mine' ? room.joined : room.visibility === 'public');
  const accept = token => run(async () => {
    if (!user) { await loginWithGoogle(); return; }
    const parsed = poolInviteToken(token);
    if (!parsed) throw new Error('Pega un enlace o código de invitación válido');
    const id = await poolRoomService.redeem(parsed);
    await refresh(); navigate(`/pool?sala=${encodeURIComponent(id)}`, { replace: true });
  });

  return <div className="min-h-screen cyber-grid px-4 py-4 text-white sm:p-6">
    <div className="mx-auto max-w-6xl space-y-8">
      <AppHeader user={user} isAdmin={isAdmin} onLogin={loginWithGoogle} onLogout={logout} loading={authLoading} showTitle={false}/>
      <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[#171433] p-6 sm:p-10">
        <MusiclubVinyl src="/musiclub_logo_3.png" alt="" className="pointer-events-none absolute -right-10 top-10 -z-10 h-64 w-64 opacity-20 sm:right-6 sm:h-80 sm:w-80"/>
        <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight sm:text-6xl">Cada sala.<br/>Su propio Pool.</h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">Descubre música con nuevas personas en una sala pública o comparte una sala privada con tu grupo. Cada sala tiene sus propias propuestas, temporadas, disco elegido e historial.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className={button} disabled={busy || authLoading} onClick={() => user ? setCreating(true) : run(loginWithGoogle)}>＋ Crear una sala</button>
          {!user && <button className="min-h-12 rounded-xl border border-white/20 px-5 text-sm font-bold" disabled={busy || authLoading} onClick={() => run(loginWithGoogle)}>Iniciar sesión para participar</button>}
        </div>
      </section>
      {(invite || invitation) && <section className="rounded-2xl border border-purple-300/25 bg-purple-500/10 p-5">
        <h2 className="text-lg font-black">Tu próxima escucha tiene sala</h2>
        <p className="mt-2 text-sm text-slate-300">Acepta la invitación para entrar. Si venció o fue revocada, pide una nueva a quien administra la sala.</p>
        <button className={`${button} mt-4`} disabled={busy || authLoading} onClick={() => accept(invite || invitation)}>{user ? 'Aceptar invitación' : 'Iniciar sesión para aceptar'}</button>
      </section>}
      {error && <div role="alert" className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}<button className="ml-4 underline" onClick={refresh} disabled={busy || loading}>Volver a cargar</button></div>}
      {ready && roomId && !selected && !invite && <p role="alert" className="rounded-xl border border-amber-300/20 p-4 text-sm text-amber-200">La sala no está disponible para tu cuenta. Para entrar a una sala privada necesitas aceptar su invitación.</p>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Directorio de salas" className="flex gap-2">{[['public','Salas públicas'],['mine','Mis salas']].map(([value,label]) => <button key={value} role="tab" aria-selected={tab===value} className={`min-h-12 rounded-xl px-5 text-sm font-bold ${tab===value?'bg-purple-500/25 text-pink-200':'bg-white/5 text-slate-300'}`} onClick={() => setTab(value)}>{label}</button>)}</div>
        <form className="flex w-full gap-2 sm:w-auto" onSubmit={event => { event.preventDefault(); accept(invitation); }}><label className="min-w-0 flex-1"><span className="sr-only">Enlace o código de invitación</span><input className="min-h-12 w-full rounded-xl border border-white/15 bg-[#15132d] px-3 text-sm sm:w-64" placeholder="Enlace o código de invitación" value={invitation} onChange={e => setInvitation(e.target.value)}/></label><button className="min-h-12 rounded-xl border border-pink-300/30 px-4 text-sm font-bold text-pink-200" disabled={busy || !invitation.trim()}>Entrar</button></form>
      </div>
      {!ready ? <p role="status" className="py-12 text-center text-purple-200">Cargando salas…</p> : <div role="tabpanel" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((room,index) => <article key={room.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171433] p-5">
          <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-purple-500/20 px-3 py-2 text-xs font-bold text-pink-200">{room.visibility==='private'?'🔒 Privada':'◎ Pública'}</span>{room.active_pool?.winner?.image_url ? <img src={room.active_pool.winner.image_url} alt={room.active_pool.winner.album_name} className="h-20 w-20 shrink-0 rounded-xl object-cover"/> : <MusiclubVinyl src={`/musiclub_logo${index%2?'_2':'_3'}.png`} alt="" className="h-20 w-20 shrink-0"/>}</div>
          <h2 className="mt-4 break-words text-xl font-black">{room.active_pool?.title || 'Sin Pool activo'}</h2>
          <p className="mt-2 break-words text-sm text-slate-300">{room.active_pool?.winner?.album_name || 'Sin disco elegido todavía'}</p>
          <p className="mt-4 text-xs text-purple-200">{identity && room.owner_id===identity?'Administras esta sala':room.joined?'Ya eres parte de esta sala':'Descubre su próxima escucha'}</p>
          <button className={`${button} mt-5 w-full`} onClick={() => open(room.id)}>Ver sala</button>
          <p className="mt-4 break-words border-t border-white/10 pt-3 text-xs text-slate-400">Sala: {room.name}</p>
        </article>)}
        {!visible.length && !error && <p className="rounded-2xl border border-white/10 p-6 text-sm text-slate-300 md:col-span-2">{tab==='mine'?'Aquí aparecerán las salas que crees o a las que te unas.':'Todavía no hay salas públicas disponibles.'}</p>}
      </div>}
      <p className="text-xs leading-relaxed text-slate-400">Una sala privada protege sus propuestas, su selección y su historial. Las reseñas que publiques en las fichas del catálogo siguen siendo públicas.</p>
      <Footer/>
    </div>
    {creating && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4"><section role="dialog" aria-modal="true" aria-labelledby="create-room-heading" className="my-4 w-full max-w-lg rounded-3xl border border-white/15 bg-[#171433] p-6"><h2 id="create-room-heading" className="text-2xl font-black">Crea tu sala de escucha</h2><form className="mt-5 space-y-4" onSubmit={event => { event.preventDefault(); run(async () => { const id=await poolRoomService.create({name,description,visibility}); await refresh(); setCreating(false); setName(''); setDescription(''); open(id); }); }}>
      <label className="block text-sm font-bold">Nombre<input autoFocus required maxLength={100} value={name} onChange={e=>setName(e.target.value)} className={field} placeholder="Las escuchas del domingo"/></label>
      <label className="block text-sm font-bold">¿Qué van a escuchar juntos?<textarea rows={3} maxLength={600} value={description} onChange={e=>setDescription(e.target.value)} className={field}/></label>
      <fieldset><legend className="text-sm font-bold">Privacidad de la sala</legend><div className="mt-2 grid gap-3 sm:grid-cols-2">{[['public','◎ Pública','Visible en el directorio. Cualquier persona con sesión puede unirse.'],['private','🔒 Privada','Solo la ven sus integrantes. Se entra con una invitación.']].map(([value,title,detail])=><label key={value} className={`cursor-pointer rounded-xl border p-4 ${visibility===value?'border-pink-300 bg-pink-300/10':'border-white/15'}`}><input type="radio" name="room-visibility" value={value} checked={visibility===value} onChange={()=>setVisibility(value)}/><span className="ml-2 font-bold">{title}</span><span className="mt-2 block text-xs leading-relaxed text-slate-300">{detail}</span></label>)}</div></fieldset>
      <p className="text-xs text-slate-400">Su primer Pool se creará con propuestas cerradas. Tú decides cuándo abrirlo.</p>
      {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
      <div className="flex flex-wrap gap-3"><button className={button} disabled={busy || !name.trim()}>{busy?'Creando…':'Crear sala'}</button><button type="button" disabled={busy} onClick={()=>setCreating(false)} className="min-h-12 px-4 text-sm font-bold">Cancelar</button></div>
    </form></section></div>}
  </div>;
}

export function PoolRoomAccess({ room, user, canManage, onBack, onRefresh }) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[invite,setInvite]=useState('');
  const run=async action=>{setBusy(true);setError('');try{await action();}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <section className="rounded-2xl border border-white/10 bg-[#171433] p-5">
    <button onClick={onBack} className="min-h-11 text-sm font-bold text-pink-200">← Todas las salas</button>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold text-purple-200">{room.visibility==='private'?'🔒 Sala privada':'◎ Sala pública'}</p><h2 className="mt-1 break-words text-2xl font-black">{room.name}</h2><p className="mt-2 whitespace-pre-line break-words text-sm text-slate-300">{room.description}</p></div>
      <div className="flex flex-wrap gap-2">{!room.joined && user && <button className={button} disabled={busy} onClick={()=>run(async()=>{await poolRoomService.join(room.id);await onRefresh();})}>Unirme a la sala</button>}
      {room.joined && !canManage && <button className="min-h-11 rounded-xl border border-white/20 px-4 text-sm" disabled={busy} onClick={()=>run(async()=>{await poolRoomService.leave(room.id);await onRefresh();onBack();})}>Salir de la sala</button>}
      {canManage && <><button className={button} disabled={busy} onClick={()=>run(async()=>{const token=await poolRoomService.invite(room.id);setInvite(`${window.location.origin}/pool?invitacion=${token}`);})}>Crear invitación</button><button className="min-h-11 rounded-xl border border-white/20 px-4 text-sm" disabled={busy} onClick={()=>run(async()=>{await poolRoomService.invite(room.id,true);setInvite('');})}>Revocar invitaciones</button></>}
      </div>
    </div>
    {invite && <label className="mt-4 block text-xs text-purple-200">Invitación · válida por 7 días; crear otra invalida la anterior<input readOnly value={invite} onFocus={e=>e.target.select()} className={field}/><button className="mt-2 min-h-11 rounded-xl border border-pink-300/30 px-4 font-bold" onClick={()=>run(()=>navigator.clipboard.writeText(invite))}>Copiar enlace</button></label>}
    {room.visibility==='private' && <p className="mt-4 text-xs leading-relaxed text-slate-400">Solo los integrantes pueden ver el Pool de esta sala. Las reseñas en las fichas del catálogo son públicas.</p>}
    {error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}
  </section>;
}
