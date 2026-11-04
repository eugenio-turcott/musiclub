'use client';
import {GenreArtwork} from './GenreArtwork';
import {MusiclubVinyl} from './MusiclubVinyl';
import presentation from '../utils/poolPresentation.cjs';
export function PoolVinyl({appearance,className='',alt=''}) {
  const a=presentation.poolAppearance(appearance);
  if(a.vinyl==='none')return null;
  return <span data-pool-vinyl={a.vinyl==='genre'?a.genre:a.logo} className={`block ${className}`}>
    {a.vinyl==='genre'?<GenreArtwork genre={a.genre} size={320} animated className="h-full w-full"/>:<MusiclubVinyl src={a.logo} alt={alt} className="h-full w-full animate-spin-slow"/>}
  </span>;
}
