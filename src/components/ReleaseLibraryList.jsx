'use client';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReleaseLibrary } from './ReleaseLibraryProvider';
import { ListenLaterButton } from './ListenLaterButton';
import { CoverImage } from './CoverImage';
import { getReleaseUrl } from '../utils/ratingUtils';
import { ReleaseStreamingLinks } from './ReleaseStreamingLinks';

export function ReleaseLibraryList({ mode = 'later' }) {
  const library = useReleaseLibrary();
  const discarded = mode === 'discarded';
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const rows = useMemo(() => library.rows.filter(row => discarded ? Boolean(row.dismissed_at) : row.listen_later)
    .filter(row => `${row.release.album_name} ${row.release.artist_name}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()))
    .sort((a, b) => (b[discarded ? 'dismissed_at' : 'saved_at'] || '').localeCompare(a[discarded ? 'dismissed_at' : 'saved_at'] || '')), [library.rows, query, discarded]);
  const pages = Math.max(1, Math.ceil(rows.length / 12)), currentPage = Math.min(page, pages);
  return <section className="space-y-4 rounded-2xl border border-white/10 bg-[#101222] p-4 sm:p-6" aria-label={discarded ? 'Historial de descartes del Gashapon' : 'Escuchar más tarde'}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-black text-white">{discarded ? 'Historial de descartes del Gashapon' : 'Escuchar más tarde'}</h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300">{discarded ? 'Los releases descartados quedan fuera de todos tus sorteos hasta que los reactives. Este historial se conserva en tu cuenta.' : 'Tu lista privada de próximas escuchas. Se guarda en tu cuenta y puedes quitar un release cuando quieras.'}</p></div>
      {library.account && <button type="button" disabled={library.pending.length > 0 || library.loading} onClick={() => library.refresh().catch(() => {})} className="min-h-11 rounded-xl border border-white/15 px-3 text-xs font-bold text-slate-200 disabled:opacity-50">Actualizar lista</button>}
    </div>
    {!library.account && !library.loading ? <button type="button" onClick={library.requireLogin} className="min-h-11 rounded-xl bg-pink-400/20 px-4 text-sm font-bold text-pink-200">Inicia sesión para ver tu lista</button> : library.loading ? <p role="status" className="text-sm text-slate-300">Cargando tu lista…</p> : library.error ? <p role="alert" className="text-sm text-rose-200">{library.error}</p> : <>
      <label className="block text-xs font-bold text-slate-300">Buscar en tu lista<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Release o artista" className="mt-2 block min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white focus:outline-pink-300" /></label>
      <p role="status" className="text-xs text-slate-400">{rows.length} {rows.length === 1 ? 'release' : 'releases'}{discarded ? ` · ${library.rows.filter(row => row.gashapon_dismissed).length} fuera del Gashapon` : ''}</p>
      {!rows.length && <p className="rounded-xl bg-white/5 p-5 text-sm text-slate-300">{query ? 'No hay coincidencias.' : discarded ? 'Aún no has descartado releases del Gashapon.' : 'Cuando un release te llame la atención, guárdalo con el botón del reloj.'}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {rows.slice((currentPage - 1) * 12, currentPage * 12).map(row => <article key={row.release_key} className="min-w-0 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex min-w-0 items-center gap-3"><Link to={getReleaseUrl(row.release)} className="shrink-0"><CoverImage src={row.release.image_url} alt={row.release.album_name} width={72} height={72} sizes="72px" className="h-[72px] w-[72px] rounded-xl object-cover" /></Link><div className="min-w-0"><Link to={getReleaseUrl(row.release)} className="line-clamp-2 text-sm font-bold text-white hover:text-pink-200" translate="no">{row.release.album_name}</Link><p translate="no" className="mt-1 text-xs text-slate-400">{row.release.artist_name}</p>{discarded && <p className={`mt-1 text-xs ${row.gashapon_dismissed ? 'text-rose-200' : 'text-emerald-200'}`}>{row.gashapon_dismissed ? 'Fuera del Gashapon' : 'Reactivado en el Gashapon'}</p>}</div></div>
          <ReleaseStreamingLinks album={row.release} />
          <div className="flex flex-wrap items-stretch gap-2">
            <Link to={getReleaseUrl(row.release)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/15 px-3 text-xs font-bold text-white">Ver release</Link>
            <ListenLaterButton album={{ ...row.release, preference_key: row.release_key }} className="flex-1" />
            {discarded && <button type="button" disabled={library.pending.includes(row.release_key)} onClick={async () => {
              setMessage('');
              try { if (await library.setPreference({ ...row.release, preference_key: row.release_key }, 'gashapon_dismissed', !row.gashapon_dismissed)) setMessage(row.gashapon_dismissed ? 'Release reactivado: ya puede volver a salir.' : 'Release descartado del Gashapon.'); }
              catch (error) { setMessage(error.message); }
            }} className="min-h-11 w-full rounded-xl border border-purple-300/25 bg-purple-400/10 px-3 text-xs font-bold text-purple-200 disabled:opacity-50">{library.pending.includes(row.release_key) ? 'Guardando…' : row.gashapon_dismissed ? 'Reactivar en el Gashapon' : 'Volver a descartar'}</button>}
          </div>
        </article>)}
      </div>
      {pages > 1 && <nav aria-label="Páginas de tu lista" className="flex items-center justify-center gap-3 text-xs text-slate-200"><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="min-h-11 rounded-xl border border-white/20 px-3 disabled:opacity-40">Anterior</button><span>{currentPage} / {pages}</span><button type="button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)} className="min-h-11 rounded-xl border border-white/20 px-3 disabled:opacity-40">Siguiente</button></nav>}
    </>}
    {message && <p role="status" className="text-xs text-pink-100">{message}</p>}
  </section>;
}
