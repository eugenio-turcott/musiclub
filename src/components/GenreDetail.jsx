'use client';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { GenreVinylViewer } from './GenreVinylViewer';
import { GenreReleaseCard } from './GenreReleaseCard';
import visuals from '../utils/genreVisuals.cjs';
import styles from './GenreHero.module.css';

export function GenreDetail({ genre, albums }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(albums.length / 24));
  const pressing = visuals.genreRevealArtwork(genre.id);
  return <div className="min-h-screen cyber-grid p-3 sm:p-6">
    <div className="mx-auto w-full max-w-7xl space-y-6">
    <AppHeader showTitle={false} />
    <section className={styles.hero} style={{'--genre-color':pressing.base, '--genre-accent':pressing.accent, '--genre-light':pressing.highlight}} aria-labelledby="genre-title">
      <Link to="/catalogo?tab=genres" className={styles.back}><span aria-hidden="true">←</span> Explorar géneros</Link>
      <div className={styles.layout}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}><span className={styles.dot} aria-hidden="true" />{albums.length} {albums.length === 1 ? 'lanzamiento del club' : 'lanzamientos del club'}</p>
          <h1 id="genre-title" translate="no" className={styles.title}>{genre.name}</h1>
          <p className={styles.description}>Un sonido, muchos discos por descubrir. Explora sus álbumes, EPs y sencillos, y encuentra tu próxima escucha.</p>
          {albums.length > 0 && <Link to={'/gashapon?genero='+encodeURIComponent(genre.id)} className={styles.action}>Descubrir en Gashapon<span className={styles.arrow} aria-hidden="true">↗</span></Link>}
        </div>
        <div className={styles.visual}><GenreVinylViewer genre={genre} className={styles.vinyl} /></div>
      </div>
    </section>
    {!albums.length ? <p className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/60">Este género aún no tiene lanzamientos en el club.</p> : <section aria-label={`Lanzamientos de ${genre.name}`} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {albums.slice((page-1)*24,page*24).map(album => <GenreReleaseCard key={album.id} album={album} />)}
    </section>}
    {pages > 1 && <nav aria-label="Páginas de lanzamientos" className="flex items-center justify-center gap-4 text-sm"><button disabled={page===1} onClick={()=>setPage(value=>value-1)} className="min-h-11 rounded-xl border border-white/20 px-4 disabled:opacity-40">Anterior</button><span>{page} / {pages}</span><button disabled={page===pages} onClick={()=>setPage(value=>value+1)} className="min-h-11 rounded-xl border border-white/20 px-4 disabled:opacity-40">Siguiente</button></nav>}
    <Footer />
    </div>
  </div>;
}
