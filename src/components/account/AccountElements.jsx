'use client';
import { useEffect, useRef, useState } from 'react';
import { UiIcon } from '../UiIcon';

export function AccountPage({ children, className = '' }) {
  const pageRef = useRef(null);
  useEffect(() => {
    const page = pageRef.current;
    const header = page.querySelector(':scope > header');
    const saveBar = page.querySelector('.settings-save-bar');
    const measure = () => {
      // Layout height is stable even while an ancestor's entrance animation scales it.
      page.style.setProperty('--account-sticky-top', `${(header?.offsetHeight || 88) + 16}px`);
      page.style.setProperty('--account-sticky-bottom', `${saveBar ? saveBar.offsetHeight + 28 : 16}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (saveBar) observer.observe(saveBar);
    return () => observer.disconnect();
  }, []);
  return <div ref={pageRef} className={`account-page ${className}`}>{children}</div>;
}

export function AccountAvatar({ src, name, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <div className={`account-avatar ${className}`}>
    {src && !failed ? <img src={src} alt={name || 'Foto de perfil'} onError={() => setFailed(true)}/> : <span aria-label={`Inicial de ${name || 'Miembro'}`}>{(name?.trim() || 'M')[0].toUpperCase()}</span>}
  </div>;
}

export function AccountSection({ id, icon, title, description, children, accent = 'pink' }) {
  return <section id={id} className={`account-section account-accent-${accent}`} aria-labelledby={`${id}-heading`}>
    <header className="account-section-heading"><span className="account-icon-plate"><UiIcon name={icon} size={24} tone="inherit"/></span><div><h2 id={`${id}-heading`}>{title}</h2>{description && <p>{description}</p>}</div></header>
    {children}
  </section>;
}

export const PROFILE_SECTIONS = [
  {id:'reviews',label:'Mis Reviews',title:'Tus reseñas',icon:'review',description:'Lo que has escuchado y lo que te dejó cada release.'},
  {id:'recommendations',label:'Para Ti',title:'Para Ti',icon:'sparkles',description:'Recomendaciones para seguir explorando tu sonido.'},
  {id:'later',label:'Escuchar más tarde',title:'Tu próxima escucha',icon:'queue',description:'Los releases que guardaste, listos cuando tú quieras.'},
  {id:'discarded',label:'Descartes del Gashapon',title:'Descartes del Gashapon',icon:'gashapon',description:'Tú decides qué releases pueden volver a salir.'},
  {id:'mailbox',label:'Buzón de Canciones',title:'Tu buzón de canciones',icon:'mailbox',description:'Música que alguien quiso compartir contigo.'},
  {id:'badges',label:'Insignias & Niveles',title:'Tus logros en el club',icon:'award',description:'Cada escucha cuenta. Aquí puedes ver tu recorrido.'},
  {id:'stats',label:'Estadísticas Detalladas',title:'Tu forma de escuchar',icon:'chart',description:'Tus notas, criterios y actividad en perspectiva.'},
];

export function ProfileNavigation({ activeTab, onChange, reviewCount, badgeCount, unreadCount }) {
  return <nav className="profile-navigation" aria-label="Secciones de Mi Perfil">
    <p className="account-eyebrow">Mi espacio</p>
    <div className="profile-navigation-items">
      {PROFILE_SECTIONS.map(section => {
        const count=section.id==='reviews'?reviewCount:section.id==='badges'?badgeCount:section.id==='mailbox'&&unreadCount?unreadCount:null;
        return <button type="button" key={section.id} aria-current={activeTab===section.id?'page':undefined} aria-controls="profile-panel" onClick={()=>onChange(section.id)}>
          <UiIcon name={section.icon} size={21} tone="inherit"/><span>{section.label}</span>{count!=null && <small>{count}</small>}
        </button>;
      })}
    </div>
  </nav>;
}
