'use client';
import {useEffect,useRef,useState} from 'react';
import {useAdvertisingPermission} from '../services/advertisingConsent';
import placements from '../utils/adsterraPlacements.cjs';

function markLoaded() { document.documentElement.dataset.musiclubAdvertisingLoaded='true'; }

function BannerFrame({banner,availableWidth}) {
  if(!banner) return null;
  return <div hidden={availableWidth<banner.width} className="max-w-full shrink-0 text-center" data-adsterra-zone={banner.id}>
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Publicidad · Adsterra</p>
    <iframe title={`Publicidad Adsterra ${banner.width} × ${banner.height}`} width={banner.width} height={banner.height}
      className="block border-0" style={{width:banner.width,height:banner.height}} loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin"
      src={placements.bannerSource(window.location.origin,banner.id)} onLoad={markLoaded} />
  </div>;
}

function NativeBanner() {
  const root=useRef(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const element=root.current;
    if(!element) return;
    let script;
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting) || script) return;
      markLoaded();
      script=document.createElement('script');
      script.id='musiclub-adsterra-native';
      script.async=true;
      script.dataset.cfasync='false';
      script.src=placements.NATIVE.src;
      script.onerror=()=>setFailed(true);
      element.appendChild(script);
      observer.disconnect();
    },{rootMargin:'250px'});
    observer.observe(element);
    return ()=>{observer.disconnect();script?.remove();};
  },[]);
  return <div ref={root} hidden={failed} data-adsterra-zone={placements.NATIVE.id} className="min-w-0 max-w-full overflow-x-auto rounded-2xl bg-white/[.025] p-3">
    <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Publicidad · Adsterra</p>
    <div id={`container-${placements.NATIVE.key}`} className="min-h-24 w-full" />
  </div>;
}

// Each page selects a size once. Resizing never refreshes an existing impression.
export function AdsterraAdvertising({variant='support'}) {
  const {allowed}=useAdvertisingPermission();
  const root=useRef(null), selected=useRef(false);
  const [sizes,setSizes]=useState(null),[width,setWidth]=useState(0);
  useEffect(()=>{
    const element=root.current;
    if(!element || !allowed) return;
    const measure=()=>{
      const value=element.getBoundingClientRect().width;
      setWidth(value);
      if(value<300 || selected.current) return;
      selected.current=true;
      const vertical=variant==='support'?placements.verticalBanner(value,window.innerHeight):null;
      setSizes({horizontal:variant==='banner'?placements.horizontalBanner(value):null,vertical});
    };
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(element);
    return ()=>observer.disconnect();
  },[allowed,variant]);
  if(!allowed) return null;
  return <section ref={root} aria-label={variant==='banner'?'Banner de Adsterra':'Publicidad de Adsterra'}
    data-advertising-position={variant==='banner'?'header':'footer'} className={`${sizes?(variant==='banner'?'my-4 sm:my-5':'my-10'):''} w-full min-w-0`}>
    {allowed && sizes && <div className="flex min-w-0 flex-wrap items-start justify-center gap-8">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-7">
        {variant==='banner' && <BannerFrame banner={sizes.horizontal} availableWidth={width} />}
        {variant==='support' && <div className="w-full min-w-0"><NativeBanner /></div>}
      </div>
      {sizes.vertical && <div hidden={width<1000}><BannerFrame banner={sizes.vertical} availableWidth={width} /></div>}
    </div>}
  </section>;
}
