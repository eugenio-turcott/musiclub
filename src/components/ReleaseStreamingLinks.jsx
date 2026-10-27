'use client';
import { SpotifyLogo, AppleMusicLogo, YouTubeLogo, DeezerLogo } from './common/PlatformLogos';
import library from '../utils/releaseLibrary.cjs';
const icons = { spotify: SpotifyLogo, apple: AppleMusicLogo, youtube: YouTubeLogo, deezer: DeezerLogo };
const colors = { spotify: 'text-emerald-300 border-emerald-300/25 bg-emerald-400/10', apple: 'text-pink-300 border-pink-300/25 bg-pink-400/10', youtube: 'text-red-300 border-red-300/25 bg-red-400/10', deezer: 'text-purple-300 border-purple-300/25 bg-purple-400/10' };
export function ReleaseStreamingLinks({ album, className = '' }) {
  return <nav aria-label="Escuchar el release" className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${className}`} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
    {library.streamingLinks(album).map(link => { const Icon = icons[link.id]; return <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-bold transition-colors hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${colors[link.id]}`}><Icon className="h-4 w-4 shrink-0" />{link.name}</a>; })}
  </nav>;
}
