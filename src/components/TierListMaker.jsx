'use client';
import {useMemo,useState} from 'react';
import {UiIcon} from './UiIcon';
import {CoverImage} from './CoverImage';
import ShareTierListModal from './ShareTierListModal';
import {classifyReviews,groupTierItems,defaultTierSelection,toggleTierSelection,TIER_LIMIT,DEFAULT_TIERS} from '../utils/tierList.mjs';
export {DEFAULT_TIERS,roundDownScore,getTierFromScore} from '../utils/tierList.mjs';
export {PLACEHOLDER_COVER} from '../utils/coverPlaceholder';
export async function generateTierListCanvas(options){return (await import('../utils/socialCards')).renderSocialCard({kind:'tierlist',profile:options.user||{name:options.userName},tierGroups:options.tierGroups,format:options.format==='landscape'?'landscape':'story'});}
export function TierListMaker({userReviews=[],albumMap=new Map(),user=null,readOnly=false}){
 const items=useMemo(()=>classifyReviews(userReviews,albumMap),[userReviews,albumMap]);
 const groups=useMemo(()=>groupTierItems(items),[items]);
 const defaults=useMemo(()=>defaultTierSelection(groups),[groups]);
 const [selection,setSelection]=useState(null),[editing,setEditing]=useState(null),[sharing,setSharing]=useState(false),[query,setQuery]=useState(''),[notice,setNotice]=useState('');
 const chosen=selection||defaults;
 const selectedGroups=Object.fromEntries(DEFAULT_TIERS.map(t=>[t.id,(groups[t.id]||[]).filter(item=>(chosen[t.id]||[]).includes(item.reviewId)).slice(0,TIER_LIMIT)]));
 const toggle=(tier,id)=>{const next=toggleTierSelection(chosen,tier,id);setNotice(next===chosen?'Máximo 10 releases por tier. Quita uno para seleccionar otro.':'');setSelection(next);};
 return <section className="tier-workspace" aria-label="Tier list musical"><header className="tier-heading"><span className="tier-heading-icon"><UiIcon name="layers" tone="inherit" size={32}/></span><div><span className="account-eyebrow">TUS CALIFICACIONES, ORDENADAS</span><h3>Tier list de {user?.name||'Musiclub'}</h3><p>{items.length} releases · Hasta 10 por tier en la selección</p></div>{!readOnly&&items.length>0&&<button type="button" className="account-primary-action" onClick={()=>setSharing(true)}><UiIcon name="share" tone="inherit"/>Compartir tier list</button>}</header>
 {notice&&<p role="status" className="tier-notice">{notice}</p>}
 {!items.length&&<p className="tier-empty">Las reseñas de este perfil aparecerán aquí cuando tenga calificaciones.</p>}
 <div className="tier-rows">{DEFAULT_TIERS.map(tier=>{const all=groups[tier.id]||[],visible=selectedGroups[tier.id]||[],isEditing=editing===tier.id;return <section className="tier-row" key={tier.id} style={{'--tier-color':tier.hexColor}} aria-label={'Tier '+tier.id}><header><span className="tier-letter">{tier.id}</span><div><h4><UiIcon name={tier.icon} tone="inherit"/>{tier.name}</h4><p>{tier.subtitle} · {visible.length}/{Math.min(TIER_LIMIT,all.length)} seleccionados <small>de {all.length}</small></p></div>{all.length>TIER_LIMIT&&<button type="button" aria-expanded={isEditing} className="tier-select-button" onClick={()=>{setEditing(isEditing?null:tier.id);setQuery('');setNotice('');}}><UiIcon name="sliders" tone="inherit"/>{isEditing?'Listo':'Elegir hasta 10'}</button>}</header>
 <div className="tier-covers">{visible.map(item=><article key={item.reviewId} title={item.album+' · '+item.artista}><div className="tier-cover-frame"><CoverImage src={item.imagen} alt={item.album}/><b>{item.score.toFixed(1)}</b></div><strong translate="no">{item.album}</strong><small translate="no">{item.artista}</small></article>)}{!all.length&&<p className="tier-empty">Sin releases en este rango.</p>}{all.length>0&&!visible.length&&<p className="tier-empty">Elige los releases que quieres incluir.</p>}</div>
 {isEditing&&<div className="tier-picker"><label><UiIcon name="search" tone="inherit"/><input aria-label={'Buscar en Tier '+tier.id} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar release o artista"/></label><p>Selecciona hasta diez. Esto sólo cambia esta presentación, nunca las notas.</p><div>{all.filter(item=>(item.album+' '+item.artista).toLowerCase().includes(query.toLowerCase())).map(item=><button type="button" key={item.reviewId} aria-pressed={chosen[tier.id]?.includes(item.reviewId)||false} onClick={()=>toggle(tier.id,item.reviewId)}><CoverImage src={item.imagen} alt=""/><span><strong>{item.album}</strong><small>{item.artista}</small></span><b>{item.score.toFixed(1)}</b><UiIcon name={chosen[tier.id]?.includes(item.reviewId)?'check':'plus'} tone="inherit"/></button>)}</div></div>}</section>;})}</div>
 {!readOnly&&<ShareTierListModal isOpen={sharing} onClose={()=>setSharing(false)} user={user} tierGroups={selectedGroups}/>}
 </section>;
}
