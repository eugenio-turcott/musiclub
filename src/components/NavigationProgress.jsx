'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';

export function NavigationProgress(){
  const pathname=usePathname(),[label,setLabel]=useState(null);
  useEffect(()=>{
    let delay,timeout;
    setLabel(null);
    const clear=()=>{clearTimeout(delay);clearTimeout(timeout);};
    const navigate=event=>{
      let target;try{target=new URL(event.detail,window.location.origin);}catch{return;}
      if(target.origin!==window.location.origin||target.pathname===pathname)return;
      clear();
      const text=target.pathname.startsWith('/artista')?'Abriendo artista…':/^\/(albumes|eps|sencillos|compilaciones|remixes)\//.test(target.pathname)?'Abriendo release…':target.pathname.startsWith('/pool')?'Abriendo Pool…':target.pathname==='/catalogo'?'Abriendo catálogo…':'Abriendo sección…';
      delay=setTimeout(()=>setLabel(text),120);
      timeout=setTimeout(()=>setLabel(null),30000);
    };
    window.addEventListener('musiclub:navigate',navigate);
    return()=>{clear();window.removeEventListener('musiclub:navigate',navigate);};
  },[pathname]);
  return label?<div className="navigation-progress" data-navigation-progress="" role="status" aria-live="polite"><span className="sr-only">{label}</span><i aria-hidden="true"/></div>:null;
}
