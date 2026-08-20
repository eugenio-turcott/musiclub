import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AppHeader } from './AppHeader';
import { supabase } from '../services/supabaseClient';

export function AdminPanel({ onClose, isPage = false }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      setAlbums(data || []);
    } catch (err) {
      console.error('Error loading albums:', err);
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const handleStatusChange = async (albumId, newStatus) => {
    try {
      if (newStatus === 'GANADOR') {
        await supabase
          .from('albums')
          .update({ status: 'ACTIVO' })
          .eq('status', 'GANADOR');
      }

      const { error } = await supabase
        .from('albums')
        .update({ status: newStatus })
        .eq('id', albumId);

      if (error) throw new Error(error.message);
      await loadAlbums();
      setShowStatusConfirm(false);
      setStatusAction(null);
      setSelectedAlbum(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);

      if (error) throw new Error(error.message);
      await loadAlbums();
      setShowDeleteConfirm(false);
      setSelectedAlbum(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVO':
        return (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Activo
          </span>
        );
      case 'INACTIVO':
        return (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-slate-300 bg-slate-500/15 border border-slate-400/30">
            Inactivo
          </span>
        );
      case 'GANADOR':
        return (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-rose-300 bg-rose-500/20 border border-rose-400/30 flex items-center gap-1 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
            🏆 Ganador
          </span>
        );
      case 'INDIVIDUAL':
        return (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 flex items-center gap-1">
            📌 Individual
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white/40 bg-white/5 border border-white/10">
            {status || 'Desconocido'}
          </span>
        );
    }
  };

  const filteredAlbums = albums.filter((album) => {
    const matchesSearch =
      album.album_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.artist_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'todos' || album.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getAvailableActions = (status) => {
    const actions = [];

    if (status === 'ACTIVO' || status === 'INACTIVO') {
      actions.push({
        label: '🏆 Marcar Ganador',
        action: 'GANADOR',
        color:
          'bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/30 shadow-sm',
      });
    }

    if (status === 'INACTIVO') {
      actions.push({
        label: '▶️ Activar',
        action: 'ACTIVO',
        color:
          'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 shadow-sm',
      });
    }

    if (status === 'ACTIVO' || status === 'GANADOR') {
      actions.push({
        label: '⏸️ Desactivar',
        action: 'INACTIVO',
        color:
          'bg-slate-500/20 border-slate-500/30 text-slate-300 hover:bg-slate-500/30 shadow-sm',
      });
    }

    if (status === 'INDIVIDUAL') {
      actions.push({
        label: '▶️ Mover a Activo',
        action: 'ACTIVO',
        color:
          'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 shadow-sm',
      });
    }

    if (status === 'ACTIVO' || status === 'INACTIVO') {
      actions.push({
        label: '📌 Mover a Individual',
        action: 'INDIVIDUAL',
        color:
          'bg-cyan-500/20 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 shadow-sm',
      });
    }

    return actions;
  };

  return (
    <div
      className={
        isPage
          ? 'min-h-screen cyber-grid p-4 sm:p-6 md:p-8'
          : 'fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] overflow-y-auto p-4 sm:p-6 md:p-8'
      }
    >
      <div className="max-w-6xl mx-auto my-2 sm:my-4 space-y-4">
        {/* Universal Standard App Header */}
        {isPage && <AppHeader showTitle={false} />}

        {/* Luces decorativas de fondo */}
        <div className="relative bg-gradient-to-br from-[#0c1322] via-[#0f1b33] to-[#070d1a] border border-blue-500/30 rounded-3xl p-5 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-white/10 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl sm:text-3xl">🔧</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Panel de Administración
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {albums.length} álbumes
                </span>
              </div>
              <p className="text-blue-200/60 text-xs sm:text-sm mt-1">
                Gestiona el estado, estatus e inventario de álbumes del sistema
              </p>
            </div>

            {!isPage && onClose && (
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-all border border-white/10 text-lg"
                title="Cerrar"
              >
                ✕
              </button>
            )}
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
            <div className="bg-black/40 rounded-2xl p-4 border border-white/10 text-center backdrop-blur-md">
              <div className="text-white text-2xl sm:text-3xl font-black">
                {albums.length}
              </div>
              <div className="text-white/40 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Total Registrados
              </div>
            </div>
            <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-500/30 text-center backdrop-blur-md">
              <div className="text-emerald-300 text-2xl sm:text-3xl font-black">
                {albums.filter((a) => a.status === 'ACTIVO').length}
              </div>
              <div className="text-emerald-300/60 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Activos
              </div>
            </div>
            <div className="bg-rose-950/20 rounded-2xl p-4 border border-rose-500/30 text-center backdrop-blur-md">
              <div className="text-rose-300 text-2xl sm:text-3xl font-black">
                {albums.filter((a) => a.status === 'GANADOR').length}
              </div>
              <div className="text-rose-300/60 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Ganadores
              </div>
            </div>
            <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-500/30 text-center backdrop-blur-md">
              <div className="text-slate-300 text-2xl sm:text-3xl font-black">
                {albums.filter((a) => a.status === 'INACTIVO').length}
              </div>
              <div className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Inactivos
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por álbum o artista..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white text-xs sm:text-sm placeholder-white/30 focus:outline-none focus:border-blue-400/50 transition-all"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-400/50 transition-all cursor-pointer"
            >
              <option value="todos" className="bg-slate-900">
                Todos los estados
              </option>
              <option value="ACTIVO" className="bg-slate-900">
                Activos
              </option>
              <option value="INACTIVO" className="bg-slate-900">
                Inactivos
              </option>
              <option value="GANADOR" className="bg-slate-900">
                Ganadores
              </option>
              <option value="INDIVIDUAL" className="bg-slate-900">
                Individuales
              </option>
            </select>
            <button
              onClick={loadAlbums}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <span>🔄</span> Actualizar
            </button>
          </div>

          {error && (
            <div className="text-rose-300 text-xs mb-4 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Lista de álbumes */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <span
                    className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></span>
                  <span
                    className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></span>
                  <span
                    className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></span>
                </div>
                <span className="text-white/40 text-xs font-medium">
                  Cargando catálogo de álbumes...
                </span>
              </div>
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="text-center py-16 bg-black/30 rounded-2xl border border-white/5">
              <p className="text-white/40 text-sm font-medium">
                No se encontraron álbumes que coincidan
              </p>
              <p className="text-white/20 text-xs mt-1">
                Intenta ajustar tu búsqueda o filtro de estado
              </p>
            </div>
          ) : (
            <div className="space-y-3 relative z-10">
              {filteredAlbums.map((album) => {
                const actions = getAvailableActions(album.status);

                return (
                  <div
                    key={album.id}
                    className={`bg-black/40 rounded-2xl p-4 border transition-all duration-300 hover:border-blue-400/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      album.status === 'GANADOR'
                        ? 'border-rose-500/30 bg-rose-950/10'
                        : album.status === 'INDIVIDUAL'
                          ? 'border-cyan-500/30 bg-cyan-950/10'
                          : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 w-full md:w-auto">
                      <img
                        src={
                          album.image_url ||
                          'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                        }
                        alt={album.album_name}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-white/10 shadow-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h4 className="text-white font-bold text-sm sm:text-base truncate">
                            {album.album_name}
                          </h4>
                          {getStatusBadge(album.status)}
                        </div>
                        <p className="text-blue-200/70 text-xs font-medium truncate">
                          {album.artist_name}
                        </p>
                        <p className="text-white/30 text-[11px] truncate mt-1">
                          Agregado por:{' '}
                          <span className="text-white/50 font-medium">
                            {album.added_by || 'Sistema'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Botones de acción responsivos */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedAlbum(album);
                            setStatusAction(action.action);
                            setShowStatusConfirm(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${action.color}`}
                        >
                          {action.label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setSelectedAlbum(album);
                          setShowDeleteConfirm(true);
                        }}
                        className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 hover:bg-rose-500/25 transition-all text-xs font-semibold"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal de confirmación para cambiar estado VÍA CREATEPORTAL */}
          {showStatusConfirm &&
            selectedAlbum &&
            createPortal(
              <div
                className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-4 overflow-y-auto"
                onClick={() => {
                  setShowStatusConfirm(false);
                  setSelectedAlbum(null);
                  setStatusAction(null);
                }}
              >
                <div
                  className="bg-[#0e172a] border border-blue-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl my-auto animate-scaleUp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl flex-shrink-0">
                      ⚙️
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-bold leading-tight">
                        Confirmar cambio de estado
                      </h3>
                      <p className="text-white/40 text-xs">Gestión de catálogo</p>
                    </div>
                  </div>

                  <p className="text-white/80 text-sm mb-5 leading-relaxed">
                    ¿Estás seguro de cambiar el estado de{' '}
                    <span className="text-white font-bold">
                      "{selectedAlbum.album_name}"
                    </span>{' '}
                    a{' '}
                    <span className="text-cyan-300 font-bold bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-md inline-block">
                      {statusAction}
                    </span>
                    ?
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() =>
                        handleStatusChange(selectedAlbum.id, statusAction)
                      }
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                    >
                      Sí, cambiar estado
                    </button>
                    <button
                      onClick={() => {
                        setShowStatusConfirm(false);
                        setSelectedAlbum(null);
                        setStatusAction(null);
                      }}
                      className="py-3 px-4 bg-white/5 border border-white/10 text-white/70 rounded-xl text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* Modal de confirmación para eliminar VÍA CREATEPORTAL */}
          {showDeleteConfirm &&
            selectedAlbum &&
            createPortal(
              <div
                className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-4 overflow-y-auto"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedAlbum(null);
                }}
              >
                <div
                  className="bg-[#0e172a] border border-rose-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl my-auto animate-scaleUp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xl flex-shrink-0">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-bold leading-tight">
                        Eliminar del sistema
                      </h3>
                      <p className="text-rose-400/70 text-xs">Acción permanente</p>
                    </div>
                  </div>

                  <p className="text-white/80 text-sm mb-5 leading-relaxed">
                    ¿Estás seguro de eliminar el álbum{' '}
                    <span className="text-white font-bold">
                      "{selectedAlbum.album_name}"
                    </span>{' '}
                    de{' '}
                    <span className="text-white font-semibold">
                      {selectedAlbum.artist_name}
                    </span>
                    ?
                    <span className="text-rose-400/90 text-xs font-medium mt-2 block bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                      ⚠️ Esta acción no se puede deshacer y borrará el registro de la base de datos.
                    </span>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => handleDeleteAlbum(selectedAlbum.id)}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-rose-500/25"
                    >
                      🗑️ Eliminar Definitivamente
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setSelectedAlbum(null);
                      }}
                      className="py-3 px-4 bg-white/5 border border-white/10 text-white/70 rounded-xl text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
}
