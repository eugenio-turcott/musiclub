import {useState,useEffect,useCallback,useRef} from 'react';
import presentation from '../utils/poolPresentation.cjs';
import {poolService,DEFAULT_POOL_ROOM_ID} from '../services/poolService';
import {notifyContentLoaded} from '../utils/translateCrashGuard';
import {createRequestCache} from '../services/requestCache.mjs';
import {useAuth} from './useAuth';

const snapshots=createRequestCache({ttl:60000,maxEntries:24});
export function usePool(seasonId,roomId=DEFAULT_POOL_ROOM_ID,initialSeason) {
  const {user}=useAuth();
  const key=JSON.stringify([user?.id||'guest',roomId,seasonId||'active']);
  const cached=snapshots.peek(key);
  const [season,setSeason]=useState(cached?.season||initialSeason||{});
  const [seasons,setSeasons]=useState(cached?.seasons||[]);
  const [activePool,setActivePool]=useState(cached?.active||[]);
  const [winner,setWinner]=useState(cached?.winner||null);
  const [poolHistory,setPoolHistory]=useState(cached?.history||[]);
  const [loading,setLoading]=useState(!cached);
  const [error,setError]=useState(null);
  const [isPoolOpen,setIsPoolOpen]=useState(false);
  const sequence=useRef(0),mutating=useRef(false),lastRead=useRef(0);
  const fetchPoolData=useCallback(async(background=false,force=false)=>{
    const request=++sequence.current;
    if(force)snapshots.invalidate(key);
    if(!background&&!snapshots.peek(key))setLoading(true);
    setError(null);
    try {
      const data=await snapshots.read(key,()=>poolService.getPoolData(seasonId,roomId));
      if(request!==sequence.current)return;
      lastRead.current=Date.now();
      setSeasons(data.seasons||[]);setSeason(data.season||{});
      setIsPoolOpen(data.season?.is_active===true&&data.season?.is_open===true&&!presentation.poolCapacity(data.season,data.season.entry_count).full);
      setActivePool(data.active||[]);setWinner(data.winner||null);setPoolHistory(data.history||[]);
    } catch(err) {
      if(request!==sequence.current)return;
      setError(err.message||'No se pudo cargar el Pool');
      if(!background){setActivePool([]);setWinner(null);setPoolHistory([]);setIsPoolOpen(false);}
    } finally {
      if(request===sequence.current){setLoading(false);notifyContentLoaded('pool');}
    }
  },[key,seasonId,roomId]);
  useEffect(()=>{fetchPoolData();return()=>{sequence.current++;};},[fetchPoolData]);
  useEffect(()=>{
    const refresh=()=>{if(!mutating.current&&document.visibilityState==='visible'&&Date.now()-lastRead.current>=60000)fetchPoolData(true);};
    const changed=event=>{
      if((event.detail?.roomId||DEFAULT_POOL_ROOM_ID)!==roomId||mutating.current)return;
      fetchPoolData(true,true);
    };
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    window.addEventListener('musiclub_seasons_change',changed);
    return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('musiclub_seasons_change',changed);};
  },[fetchPoolData,roomId]);
  const run=useCallback(async action=>{
    mutating.current=true;
    try {const result=await action();await fetchPoolData(true,true);return result;}
    finally {mutating.current=false;}
  },[fetchPoolData]);
  const nominateAlbum=useCallback(proposal=>run(()=>poolService.nominateAlbumToPool({...proposal,seasonId:season.id})),[run,season.id]);
  const editNomination=useCallback(proposal=>run(()=>poolService.editPoolNomination({...proposal,seasonId:season.id})),[run,season.id]);
  const selectWinner=useCallback(id=>run(()=>poolService.selectWinner(id,season.id,roomId)),[run,season.id,roomId]);
  const archiveCurrentWinner=useCallback(id=>run(()=>poolService.archiveCurrentWinner(id,season.id,roomId)),[run,season.id,roomId]);
  const toggleWinnerReviews=useCallback((id,enabled)=>run(async()=>{
    const result=await poolService.toggleWinnerReviews(id,enabled,season.id);
    window.dispatchEvent(new Event('musiclub:review-access-change'));return result;
  }),[run,season.id]);
  const scheduleWinnerReviews=useCallback((id,date)=>run(async()=>{
    const result=await poolService.scheduleWinnerReviews(id,date,season.id);
    window.dispatchEvent(new Event('musiclub:review-access-change'));return result;
  }),[run,season.id]);
  const setPoolOpenStatus=useCallback(open=>run(()=>poolService.setPoolOpenStatus(open,season.id)),[run,season.id]);
  const createSeason=useCallback(data=>run(()=>poolService.createSeason({...data,room_id:roomId})),[run,roomId]);
  const updateSeason=useCallback((id,data)=>run(()=>poolService.updateSeason(id,data,roomId)),[run,roomId]);
  const deleteSeason=useCallback(id=>run(()=>poolService.deleteSeason(id,roomId)),[run,roomId]);
  const setActiveSeason=useCallback(id=>run(()=>poolService.setActiveSeason(id,roomId)),[run,roomId]);
  const refetch=useCallback(()=>fetchPoolData(true,true),[fetchPoolData]);
  return {season,seasons,activePool,winner,poolHistory,totalActive:activePool.length,totalHistory:poolHistory.length,isPoolOpen,loading,error,
    nominateAlbum,editNomination,selectWinner,archiveCurrentWinner,toggleWinnerReviews,scheduleWinnerReviews,setPoolOpenStatus,
    openPool:()=>setPoolOpenStatus(true),closePool:()=>setPoolOpenStatus(false),createSeason,updateSeason,deleteSeason,setActiveSeason,
    refetch,reloadSeasons:refetch};
}
export default usePool;
