'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import {useAdvertisingPermission} from '../services/advertisingConsent';
import {useAdvertisingSlots} from './AdvertisingPlacementProvider';
import policy from '../utils/advertisingPolicy.cjs';
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

// Reserve once per page: no duplicate units or refreshes when resizing.
export function AdsterraAdvertising({variant='support',slot=variant}) {
  const {allowed}=useAdvertisingPermission();
  const pathname=usePathname(),registry=useAdvertisingSlots();
  const enabled=allowed&&policy.publicAdvertisingPath(pathname);
  const root=useRef(null), selected=useRef(false);
  const [sizes,setSizes]=useState(null),[width,setWidth]=useState(0);
  useEffect(()=>{
    const element=root.current;
    if(!element || !enabled || !registry) return;
    const measure=()=>{
      const value=element.getBoundingClientRect().width;
      setWidth(value);
      if(value<300 || selected.current) return;
      selected.current=true;
      const native=variant==='native'||variant==='support';
      const candidates=native?[placements.NATIVE]:variant==='banner'
        ? [placements.BANNERS.wide,placements.BANNERS.medium,placements.BANNERS.mobile,placements.BANNERS.rectangle]
        : variant==='rectangle'?[placements.BANNERS.rectangle]
        : [placements.BANNERS.medium,placements.BANNERS.mobile,placements.BANNERS.rectangle];
      const placement=registry.reserve(slot,candidates.filter(item=>!item.width||item.width<=value));
      setSizes({placement,native});
    };
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(element);
    return ()=>{observer.disconnect();registry.release(slot);selected.current=false;};
  },[enabled,variant,slot,registry]);
  if(!enabled || (sizes&&!sizes.placement)) return null;
  return <section ref={root} aria-label={variant==='banner'?'Banner de Adsterra':variant==='native'||variant==='support'?'Publicidad de Adsterra':'Publicidad entre secciones'}
    data-advertising-position={variant==='banner'?'header':variant==='support'?'footer':'content'} data-advertising-slot={slot}
    className={`${sizes?(variant==='banner'?'my-4 sm:my-5':'my-8 sm:my-10'):''} w-full min-w-0`}>
    {sizes?.placement && (sizes.native?<NativeBanner/>:<div className="flex min-w-0 justify-center"><BannerFrame banner={sizes.placement} availableWidth={width}/></div>)}
  </section>;
}

export function AdvertisingRails() {
  const {allowed}=useAdvertisingPermission();
  const pathname=usePathname(),registry=useAdvertisingSlots();
  const enabled=allowed&&policy.publicAdvertisingPath(pathname);
  const [state,setState]=useState({width:0,height:0,top:120,left:null,right:null});
  useEffect(()=>{
    if(!enabled||!registry) return;
    const measure=()=>setState(previous=>{
      const width=window.innerWidth,height=window.innerHeight;
      const top=Math.ceil(document.querySelector('header')?.getBoundingClientRect().height||96)+48;
      const room=width>=1720;
      return {width,height,top,
        left:previous.left||(room&&height-top>=620?registry.reserve('rail-left',[placements.BANNERS.tower]):null),
        right:previous.right||(room&&height-top>=320?registry.reserve('rail-right',[placements.BANNERS.compactTower]):null)};
    });
    measure();window.addEventListener('resize',measure);
    return ()=>{window.removeEventListener('resize',measure);registry.release('rail-left');registry.release('rail-right');};
  },[enabled,registry]);
  if(!enabled||(!state.left&&!state.right)) return null;
  return createPortal(<>{['left','right'].map(side=>state[side]&&<aside key={side} aria-label={`Publicidad lateral ${side==='left'?'izquierda':'derecha'}`}
    data-advertising-rail={side} hidden={state.width<1720||state.height-state.top<state[side].height+20}
    className="fixed z-10 w-[160px]" style={{top:state.top,[side]:'calc((100vw - 1280px) / 2 - 184px)'}}>
    <BannerFrame banner={state[side]} availableWidth={160}/>
  </aside>)}</>,document.body);
}
