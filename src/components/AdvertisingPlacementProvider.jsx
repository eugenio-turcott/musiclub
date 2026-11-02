'use client';
import {createContext,useContext,useMemo} from 'react';
import {usePathname} from 'next/navigation';
const Slots=createContext(null);
export function AdvertisingPlacementProvider({children}) {
  const pathname=usePathname();
  const registry=useMemo(()=>{
    const owners=new Map();
    return {
      reserve(slot,candidates) {
        const placement=candidates.find(item=>!owners.has(item.id)||owners.get(item.id)===slot);
        if(placement) owners.set(placement.id,slot);
        return placement||null;
      },
      release(slot) { for(const [id,owner] of owners) if(owner===slot) owners.delete(id); },
    };
  },[pathname]);
  return <Slots.Provider value={registry}>{children}</Slots.Provider>;
}
export function useAdvertisingSlots() { return useContext(Slots); }
