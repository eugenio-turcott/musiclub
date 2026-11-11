'use client';
import dynamic from 'next/dynamic';
import {useAuth} from '../hooks/useAuth';
import {useEffect,useState} from 'react';
import {supabaseService} from '../services/supabaseClient';
import {createRequestCache} from '../services/requestCache.mjs';
const Studio=dynamic(()=>import('./ShareStudio').then(module=>module.ShareStudio),{ssr:false});
const progressCache=createRequestCache({ttl:60000,maxEntries:4});
export function ShareProfileModal({isOpen,onClose,profile}){
  const {user}=useAuth();
  const allowed=Boolean(user?.id&&profile?.id===user.id);
  const supplied=profile?.total_xp!=null&&Array.isArray(profile?.badges);
  const [progress,setProgress]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const id=profile?.id;
  useEffect(()=>{
    if(!isOpen||!allowed||supplied)return;
    let current=true;setError('');
    progressCache.read(id,async()=>{
      const rows=await supabaseService.getDetailedLeaderboard();
      const own=rows.find(row=>row.id===id);
      if(!own)throw new Error('No se pudo consultar tu progreso.');
      return {id,total_xp:own.total_xp,badges:own.badges||[],review_count:own.review_count,total_tracks_rated:own.total_tracks_rated};
    }).then(data=>{if(current)setProgress(data);}).catch(()=>{if(current)setError('No pudimos consultar tu XP e insignias. Inténtalo de nuevo.');});
    return()=>{current=false;};
  },[isOpen,allowed,supplied,id,attempt]);
  if(!isOpen||!allowed)return null;
  const ready=supplied||progress?.id===id;
  return <Studio isOpen onClose={onClose} kind="profile" profile={{...profile,...(!supplied&&progress?.id===id?progress:{})}} profileLoading={!ready&&!error} profileError={error} onRetryProfile={()=>{progressCache.invalidate(id);setAttempt(value=>value+1);}}/>;
}
