'use client';
import {AppHeader} from './AppHeader';
import {DetailLoading} from './DetailLoading';
import {Link} from 'react-router-dom';
import {UiIcon} from './UiIcon';
export function NavigationLoading({label='Abriendo Musiclub…'}){
  return <div className="navigation-loading-shell cyber-grid"><div className="navigation-loading-content"><AppHeader showAdvertising={false}/><section aria-label="Contenido en preparación" className="navigation-loading-section"><div className="navigation-loading-caption"><UiIcon name="headphones" tone="inherit"/><span>Un momento para tu próxima escucha</span></div><DetailLoading label={label}/></section><nav className="navigation-loading-shortcuts" aria-label="Seguir explorando">{[['/catalogo','disc','Catálogo'],['/pool','pool','Pools'],['/reviews','review','Reseñas'],['/guias','sparkles','Conoce Musiclub']].map(([url,icon,name])=><Link key={url} to={url}><UiIcon name={icon} tone="inherit"/>{name}</Link>)}</nav></div></div>;
}
