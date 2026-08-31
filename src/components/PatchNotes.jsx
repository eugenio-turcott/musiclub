// src/components/PatchNotes.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GITHUB_COMMITS_API,
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
  mergeGithubCommitsWithCuratedNotes,
} from '../data/patchNotesData';

const ITEMS_PER_PAGE = 6;

export function PatchNotes({ isPage = false }) {
  const [githubCommits, setGithubCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar commits desde GitHub API con fallback a notas curadas
  const fetchGithubCommits = useCallback(async () => {
    setLoading(true);
    setSyncError(null);
    try {
      const response = await fetch(GITHUB_COMMITS_API, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setGithubCommits(data);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Nota: Usando historial local de Musiclub:', err.message);
      setSyncError('Mostrando historial local sin conexión directa a GitHub.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGithubCommits();
  }, [fetchGithubCommits]);

  // Fusionar commits en vivo con notas curadas
  const allPatchNotes = useMemo(() => {
    return mergeGithubCommitsWithCuratedNotes(githubCommits);
  }, [githubCommits]);

  // Filtrado reactivo por texto y por tags
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allPatchNotes.filter((note) => {
      // Filtro de tag
      if (selectedTag === 'V5' && !note.version.startsWith('V.5') && !note.version.startsWith('v.5')) return false;
      if (selectedTag === 'V4' && !note.version.startsWith('V.4') && !note.version.startsWith('v.4')) return false;
      if (selectedTag === 'V3' && !note.version.startsWith('V.3') && !note.version.startsWith('v.3')) return false;
      if (selectedTag === 'V2' && !note.version.startsWith('V.2') && !note.version.startsWith('v.2')) return false;
      if (selectedTag === 'V1' && !note.version.startsWith('V.1') && !note.version.startsWith('v.1')) return false;
      if (selectedTag === 'V0' && !note.version.startsWith('V.0') && !note.version.startsWith('v.0')) return false;

      if (!q) return true;

      // Filtro de texto
      const matchesTitle = (note.title || '').toLowerCase().includes(q);
      const matchesVersion = (note.version || '').toLowerCase().includes(q);
      const matchesSummary = (note.summary || '').toLowerCase().includes(q);
      const matchesChanges = (note.changes || []).some(
        (c) =>
          (c.title || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      );

      return matchesTitle || matchesVersion || matchesSummary || matchesChanges;
    });
  }, [allPatchNotes, searchQuery, selectedTag]);

  // Resetear a la página 1 cuando cambia la búsqueda o el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / ITEMS_PER_PAGE));
  const paginatedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNotes, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Hero Header de Patch Notes */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#121426] via-[#1a1738] to-[#0c0d1e] border border-white/10 shadow-2xl">
        {/* Orbes decorativos */}
        <div className="absolute -top-12 -right-12 w-60 h-60 bg-[#f5576c]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-[#f093fb]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-[#f5576c] text-xs font-extrabold uppercase tracking-widest shadow-sm">
              <span>📜</span>
              <span>Historial de Desarrollo & Actualizaciones</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f093fb] to-[#f5576c] tracking-tight">
              Patch Notes Musiclub
            </h1>
            <p className="text-white/70 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
              Consulta en tiempo real cada mejora, nueva función y corrección implementada en la plataforma, sincronizado directamente con la rama principal de GitHub.
            </p>
          </div>

          {/* Badges de Versiones y Botón de Sync */}
          <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md flex items-center gap-2 shadow-xl">
                <span className="text-xs">📦</span>
                <div className="text-left">
                  <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                    Registradas
                  </p>
                  <p className="text-white font-black text-xs sm:text-sm leading-tight">
                    {allPatchNotes.length} Versiones
                  </p>
                </div>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md flex items-center gap-3 shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div className="text-left">
                  <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                    Versión Actual
                  </p>
                  <p className="text-white font-black text-base sm:text-lg leading-tight">
                    {allPatchNotes[0]?.version || 'V.5.8'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchGithubCommits}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              title="Volver a consultar los commits de GitHub"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>{loading ? 'Sincronizando...' : 'Sincronizar GitHub'}</span>
            </button>
          </div>
        </div>

        {/* Estado de conexión con GitHub */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <a
              href={`https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-pink-300 hover:text-white transition-colors font-medium hover:underline"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}</span>
            </a>
            <span>•</span>
            <span>Rama: <strong className="text-white/80">master</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {lastSyncTime ? (
              <span>
                Última sincronización: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : syncError ? (
              <span className="text-amber-300">{syncError}</span>
            ) : (
              <span>Cargando datos...</span>
            )}
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        {/* Buscador de texto */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por función, corrección, versión o palabra clave..."
            className="w-full pl-9 pr-8 py-2 bg-black/40 border border-white/15 focus:border-[#f5576c] rounded-xl text-white text-xs sm:text-sm placeholder-white/40 focus:outline-none transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs sm:text-sm">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros de Versión */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: `Todas (${allPatchNotes.length})` },
            { id: 'V5', label: 'V5.x' },
            { id: 'V4', label: 'V4.x' },
            { id: 'V3', label: 'V3.x' },
            { id: 'V2', label: 'V2.x' },
            { id: 'V1', label: 'V1.x' },
            { id: 'V0', label: 'V0.x (Prototipos)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTag(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedTag === tab.id
                  ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md shadow-pink-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info de Paginación Superior */}
      <div className="flex items-center justify-between text-xs text-white/50 px-1">
        <span>
          Mostrando {paginatedNotes.length} de {filteredNotes.length} versiones
          {selectedTag !== 'ALL' && ` (Filtro: ${selectedTag})`}
        </span>
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>

      {/* Lista de Versiones Paginada */}
      <div className="space-y-6">
        {paginatedNotes.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-3xl bg-white/5 border border-white/10 text-white/50 space-y-2">
            <span className="text-4xl block">🔍</span>
            <p className="text-base font-bold text-white">No se encontraron notas de versión</p>
            <p className="text-xs">Prueba ajustando el término de búsqueda o seleccionando otra versión.</p>
          </div>
        ) : (
          paginatedNotes.map((release, idx) => {
            const isPending = release.sha === 'pending';

            return (
              <div
                key={release.version + '-' + (release.sha || idx)}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f1122] via-[#15172e] to-[#0a0c1a] border ${
                  isPending ? 'border-pink-500/40 shadow-pink-500/10' : 'border-white/15'
                } p-5 sm:p-7 shadow-xl space-y-5 hover:border-pink-500/30 transition-all group`}
              >
                {/* Header de la Tarjeta de Versión */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white font-black text-sm sm:text-base shadow-md">
                      {release.version}
                    </span>
                    {release.tag && (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${release.tagColor || 'from-blue-500 to-indigo-500'} text-white shadow-sm`}
                      >
                        {release.tag}
                      </span>
                    )}
                    {isPending && (
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse">
                        ⚡ Próxima versión lista
                      </span>
                    )}
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <span>📅</span>
                      <span>{release.date}</span>
                    </span>
                  </div>

                  {/* Info de Commit / Autor en GitHub */}
                  <div className="flex items-center gap-2.5 text-xs text-white/60">
                    {release.authorAvatar && (
                      <img
                        src={release.authorAvatar}
                        alt={release.authorName}
                        className="w-5 h-5 rounded-full border border-white/20"
                      />
                    )}
                    <span className="truncate max-w-[120px]">{release.authorName || 'Eugenio Turcott'}</span>
                    {release.sha && release.sha !== 'pending' ? (
                      <a
                        href={release.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-pink-300 hover:text-white font-mono text-[11px] transition-colors flex items-center gap-1"
                        title="Ver commit en GitHub"
                      >
                        <span>#</span>
                        <span>{release.sha}</span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-300 font-mono text-[11px]">
                        commit pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Título y Resumen */}
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-pink-200 transition-colors">
                    {release.title}
                  </h3>
                  {release.summary && (
                    <p className="text-white/70 text-xs sm:text-sm mt-1.5 leading-relaxed">
                      {release.summary}
                    </p>
                  )}
                </div>

                {/* Lista detallada de cambios */}
                {release.changes && release.changes.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-white/40">
                      Detalle de Cambios ({release.changes.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {release.changes.map((change, cIdx) => {
                        const isFeature = change.type === 'feature';
                        const isFix = change.type === 'fix';
                        const isImprovement = change.type === 'improvement';
                        const isDatabase = change.type === 'database';

                        const badgeIcon = isFeature ? '✨' : isFix ? '🐛' : isImprovement ? '⚡' : isDatabase ? '🗄️' : '🛠️';
                        const badgeLabel = isFeature ? 'Novedad' : isFix ? 'Corrección' : isImprovement ? 'Optimización' : isDatabase ? 'Base de Datos' : 'Mejora';
                        const badgeStyle = isFeature
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isFix
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : isDatabase
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

                        return (
                          <div
                            key={cIdx}
                            className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all"
                          >
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 flex-shrink-0 mt-0.5 ${badgeStyle}`}
                            >
                              <span>{badgeIcon}</span>
                              <span>{badgeLabel}</span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-bold text-xs sm:text-sm">
                                {change.title}
                              </p>
                              {change.description && (
                                <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                                  {change.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-white/10">
          <p className="text-xs text-white/50">
            Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong> ({filteredNotes.length} versiones en total)
          </p>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Botón Anterior */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              « Anterior
            </button>

            {/* Botones de Páginas */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md shadow-pink-500/20'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Botón Siguiente */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Siguiente »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
