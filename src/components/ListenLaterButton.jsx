'use client';
import { useEffect, useState } from 'react';
import { useReleaseLibrary } from './ReleaseLibraryProvider';
import library from '../utils/releaseLibrary.cjs';

export function ClockIcon({ className = 'h-4 w-4' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

export function ListenLaterButton({ album, className = '' }) {
  const libraryState = useReleaseLibrary();
  const row = library.findPreference(album, libraryState.rows);
  const key = row?.release_key || library.releaseKey(album);
  const saved = Boolean(row?.listen_later);
  const [error, setError] = useState('');
  useEffect(() => setError(''), [key, libraryState.account]);
  const busy = libraryState.loading || libraryState.pending.includes(key);
  return <span className={`inline-flex min-w-0 flex-col ${className}`} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
    <button type="button" aria-pressed={saved} disabled={busy}
      aria-label={`${saved ? 'Quitar de Escuchar más tarde' : 'Escuchar más tarde'}: ${library.releaseSnapshot(album).album_name}`}
      onClick={async event => {
        event.preventDefault();
        setError('');
        if (!libraryState.account) { libraryState.requireLogin(); return; }
        try {
          const latest = libraryState.error ? await libraryState.refresh() : libraryState;
          const wasSaved = Boolean(library.findPreference(album, latest.rows)?.listen_later);
          await libraryState.setPreference(album, 'listen_later', !wasSaved);
        }
        catch (failure) { setError(failure.message); }
      }}
      className={`flex min-h-11 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-bold leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-300 disabled:cursor-wait disabled:opacity-60 ${saved ? 'border-pink-300/40 bg-pink-400/15 text-pink-200 hover:bg-pink-400/25' : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'}`}>
      <ClockIcon className="h-4 w-4 shrink-0" /><span>{busy ? 'Cargando…' : saved ? 'Guardado para después' : 'Escuchar más tarde'}</span>
    </button>
    {error && <span role="alert" className="mt-1 text-[11px] text-rose-200">{error}</span>}
  </span>;
}
