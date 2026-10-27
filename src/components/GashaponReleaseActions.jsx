'use client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListenLaterButton } from './ListenLaterButton';
import { ReleaseStreamingLinks } from './ReleaseStreamingLinks';
import { useReleaseLibrary } from './ReleaseLibraryProvider';
import helpers from '../utils/releaseLibrary.cjs';

export function GashaponReleaseActions({ album, onDiscard }) {
  const library = useReleaseLibrary();
  const [error, setError] = useState('');
  const key = helpers.findPreference(album, library.rows)?.release_key || helpers.releaseKey(album);
  return <div className="relative w-full space-y-3">
    <ReleaseStreamingLinks album={album} />
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <ListenLaterButton album={album} />
      <button type="button" disabled={library.loading || library.pending.includes(key)} onClick={async () => {
        setError('');
        if (!library.account) { library.requireLogin(); return; }
        try { if (await library.setPreference(album, 'gashapon_dismissed', true)) onDiscard?.(); }
        catch (failure) { setError(failure.message); }
      }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200 disabled:opacity-50">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></svg>{library.pending.includes(key) ? 'Guardando…' : 'Descartar del Gashapon'}
      </button>
    </div>
    <p className="text-center text-[11px] text-slate-400">Descartar lo excluye de tus sorteos hasta que lo reactives en el <Link to="/profile?tab=discarded" className="text-purple-200 underline underline-offset-2">historial de descartes</Link>.</p>
    {error && <p role="alert" className="text-xs text-rose-200">{error}</p>}
  </div>;
}
