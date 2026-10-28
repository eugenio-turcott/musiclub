'use client';
import { Link } from 'react-router-dom';
import { InterfaceText, UiIcon } from '../UiIcon';
import { GenreLabel } from '../GenreLabel';
import { MusiclubVinyl } from '../MusiclubVinyl';
import { SpotifyIcon, InstagramIcon } from '../ShareReviewModal';
import { getMelomanoLevel, MELOMANO_LEVELS } from '../../utils/badgeSystem';
import { AccountAvatar } from './AccountElements';

export function ProfileIdentity({ user, isAdmin, gamification, stats }) {
  const xp=Number(gamification.totalXp) || 0;
  const level=getMelomanoLevel(xp);
  const next=MELOMANO_LEVELS.find(item=>item.minXp>xp);
  const progress=next?Math.min(100,Math.max(0,(xp-level.minXp)/(next.minXp-level.minXp)*100)):100;
  const metrics=[
    ['review','Reseñas',stats.totalReviews,'pink'],
    ['star','Promedio dado',stats.totalReviews?stats.averageScore.toFixed(1):'—','amber'],
    ['notes','Pistas calificadas',stats.totalTracksRated,'cyan'],
    ['award','Insignias',gamification.badges?.length || 0,'purple'],
  ];
  return <section className="profile-identity" aria-label="Tu perfil musical">
    <div className="profile-identity-top"><span className="account-eyebrow">Mi Perfil</span><Link to="/settings" className="account-secondary-action"><UiIcon name="edit" tone="inherit"/>Editar perfil</Link></div>
    <div className="profile-identity-layout">
      <div className="profile-portrait"><div className="profile-portrait-disc" aria-hidden="true"><MusiclubVinyl src="/musiclub_logo.png" alt="" className="w-full h-full"/></div><AccountAvatar src={user.avatar_url || user.avatar} name={user.name}/></div>
      <div className="profile-introduction">
        <span className="profile-member-label"><UiIcon name={isAdmin?'shield':'headphones'} size={16} tone="inherit"/>{isAdmin?'Administrador':'Miembro de Musiclub'}</span>
        <h1 translate="no" className="notranslate username-tag">{user.name || 'Miembro de Musiclub'}</h1>
        <p className={`profile-bio ${user.bio?'':'profile-bio-empty'}`}>{user.bio || 'Este es tu espacio para guardar música, compartir reseñas y encontrar tu siguiente escucha.'}</p>
        {gamification.badges?.length>0 && <div className="profile-featured-badges" aria-label="Insignias destacadas">{gamification.badges.slice(0,3).map(b=><span key={b.id} title={b.tooltip || b.desc} className={`bg-linear-to-r ${b.color} ${b.borderClass || ''}`}><InterfaceText>{b.label}</InterfaceText></span>)}</div>}
      </div>
      <aside className="profile-level-card" aria-label="Tu progreso en Musiclub">
        <div className="profile-level-top"><span className="account-eyebrow">Score XP</span><UiIcon name="sparkles" size={24} tone="inherit"/></div>
        <strong className="profile-xp-value">{xp.toLocaleString('es-MX')}<span> XP</span></strong>
        <p className="profile-level-name"><InterfaceText>{level.title}</InterfaceText></p>
        <div className="profile-level-progress" role="progressbar" aria-label="Progreso al siguiente nivel" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{width:`${progress}%`}}/></div>
        <p className="profile-level-caption">{next?`${(next.minXp-xp).toLocaleString('es-MX')} XP para el siguiente nivel`:'Alcanzaste el nivel más alto del club'}</p>
      </aside>
    </div>
    {(user.favorite_artist || user.favorite_album || user.favorite_genres?.length || user.spotify_url || user.instagram_url) && <div className="profile-musical-identity">
      {user.favorite_artist && <span className="profile-favorite"><UiIcon name="mic" tone="inherit"/><span><small>Artista favorito</small><strong translate="no">{user.favorite_artist}</strong></span></span>}
      {user.favorite_album && <span className="profile-favorite"><UiIcon name="disc" tone="inherit"/><span><small>Álbum favorito</small><strong translate="no">{user.favorite_album}</strong></span></span>}
      {Array.isArray(user.favorite_genres)&&user.favorite_genres.map(genre=><span key={genre} className="profile-genre"><GenreLabel genre={genre} link size={20}/></span>)}
      {user.spotify_url && <a className="profile-social profile-social-spotify" href={user.spotify_url} target="_blank" rel="noopener noreferrer"><SpotifyIcon className="w-4 h-4"/>Spotify</a>}
      {user.instagram_url && <a className="profile-social profile-social-instagram" href={user.instagram_url} target="_blank" rel="noopener noreferrer"><InstagramIcon className="w-4 h-4"/>Instagram</a>}
    </div>}
    <div className="profile-metrics">{metrics.map(([icon,label,value,accent])=><div key={label} className={`account-accent-${accent}`}><UiIcon name={icon} size={23} tone="inherit"/><span><strong>{value}</strong><small>{label}</small></span></div>)}</div>
  </section>;
}
