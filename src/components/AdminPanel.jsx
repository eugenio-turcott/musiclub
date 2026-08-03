// src/components/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export function AdminPanel({ onClose, isPage = false }) {
  // 👈 AGREGAR isPage como prop
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
      // Si vamos a marcar como GANADOR, primero resetear cualquier otro ganador
      if (newStatus === 'GANADOR') {
        // Resetear todos los GANADOR a ACTIVO
        await supabase
          .from('albums')
          .update({ status: 'ACTIVO' })
          .eq('status', 'GANADOR');
      }

      // Actualizar el álbum seleccionado
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVO':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'INACTIVO':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'GANADOR':
        return 'text-[#f5576c] bg-[#f5576c]/10 border-[#f5576c]/20';
      case 'INDIVIDUAL':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-white/30 bg-white/5 border-white/5';
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

  // Función para obtener las acciones disponibles según el estado
  const getAvailableActions = (status) => {
    const actions = [];

    // Marcar como Ganador - solo para ACTIVO e INACTIVO
    if (status === 'ACTIVO' || status === 'INACTIVO') {
      actions.push({
        label: '🏆 Marcar Ganador',
        action: 'GANADOR',
        color:
          'bg-[#f5576c]/20 border-[#f5576c]/30 text-[#f5576c] hover:bg-[#f5576c]/30',
      });
    }

    // Activar - si está INACTIVO
    if (status === 'INACTIVO') {
      actions.push({
        label: '▶️ Activar',
        action: 'ACTIVO',
        color:
          'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30',
      });
    }

    // Desactivar - si está ACTIVO o GANADOR
    if (status === 'ACTIVO' || status === 'GANADOR') {
      actions.push({
        label: '⏸️ Desactivar',
        action: 'INACTIVO',
        color:
          'bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30',
      });
    }

    // Convertir a ACTIVO - si es INDIVIDUAL
    if (status === 'INDIVIDUAL') {
      actions.push({
        label: '▶️ Mover a Activo',
        action: 'ACTIVO',
        color:
          'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30',
      });
    }

    // Convertir a INDIVIDUAL - si es ACTIVO o INACTIVO
    if (status === 'ACTIVO' || status === 'INACTIVO') {
      actions.push({
        label: '📌 Mover a Individual',
        action: 'INDIVIDUAL',
        color:
          'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30',
      });
    }

    return actions;
  };

  return (
    <div
      className={
        isPage
          ? 'min-h-screen cyber-grid p-4 sm:p-6'
          : 'fixed inset-0 bg-black/95 backdrop-blur-xl z-[99999] overflow-y-auto p-4'
      }
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🔧</span>
              Panel de Administración
            </h1>
            <p className="text-white/30 text-sm mt-1">
              Gestiona los álbumes del sistema
            </p>
          </div>
          {isPage ? (
            <a
              href="/"
              className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-2"
            >
              ← Volver
            </a>
          ) : (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/70 transition-colors text-2xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-white text-2xl font-bold">{albums.length}</div>
            <div className="text-white/30 text-xs uppercase tracking-wider">
              Total
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-green-400 text-2xl font-bold">
              {albums.filter((a) => a.status === 'ACTIVO').length}
            </div>
            <div className="text-white/30 text-xs uppercase tracking-wider">
              Activos
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-[#f5576c] text-2xl font-bold">
              {albums.filter((a) => a.status === 'GANADOR').length}
            </div>
            <div className="text-white/30 text-xs uppercase tracking-wider">
              Ganadores
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-gray-400 text-2xl font-bold">
              {albums.filter((a) => a.status === 'INACTIVO').length}
            </div>
            <div className="text-white/30 text-xs uppercase tracking-wider">
              Inactivos
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o artista..."
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f5576c]/50"
          >
            <option value="todos">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="GANADOR">Ganadores</option>
            <option value="INDIVIDUAL">Individuales</option>
          </select>
          <button
            onClick={loadAlbums}
            className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white/60 hover:bg-white/20 hover:text-white transition-all text-sm"
          >
            🔄 Actualizar
          </button>
        </div>

        {error && (
          <div className="text-[#f5576c] text-xs mb-3 bg-[#f5576c]/10 px-3 py-2 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Lista de álbumes */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <span
                  className="w-3 h-3 bg-[#f5576c] rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></span>
                <span
                  className="w-3 h-3 bg-[#f093fb] rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-3 h-3 bg-[#f5576c] rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
              </div>
              <span className="text-white/30 text-sm">Cargando álbumes...</span>
            </div>
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-white/30 text-sm">
              No hay álbumes en el sistema
            </p>
            <p className="text-white/20 text-xs mt-1">
              Agrega álbumes desde la búsqueda de Spotify
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAlbums.map((album) => {
              const actions = getAvailableActions(album.status);

              return (
                <div
                  key={album.id}
                  className={`bg-white/5 rounded-xl p-3 border transition-all hover:bg-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
                    album.status === 'GANADOR'
                      ? 'border-[#f5576c]/30'
                      : album.status === 'INDIVIDUAL'
                        ? 'border-blue-500/20'
                        : 'border-white/5'
                  }`}
                >
                  <img
                    src={
                      album.image_url ||
                      'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                    }
                    alt={album.album_name}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      e.target.src =
                        'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-white font-medium text-sm truncate">
                        {album.album_name}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(album.status)}`}
                      >
                        {album.status || 'ACTIVO'}
                      </span>
                      {album.status === 'GANADOR' && (
                        <span className="text-[10px] text-[#f5576c] bg-[#f5576c]/10 px-2 py-0.5 rounded-full border border-[#f5576c]/20 animate-pulse">
                          🏆 Ganador
                        </span>
                      )}
                      {album.status === 'INDIVIDUAL' && (
                        <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                          📌 Individual
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs truncate">
                      {album.artist_name}
                    </p>
                    <p className="text-white/20 text-[10px] truncate">
                      Agregado por: {album.added_by || 'Sistema'} ·{' '}
                      {album.added_by_email || ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedAlbum(album);
                          setStatusAction(action.action);
                          setShowStatusConfirm(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs transition-all ${action.color}`}
                      >
                        {action.label}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedAlbum(album);
                        setShowDeleteConfirm(true);
                      }}
                      className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs hover:bg-red-500/30 transition-all"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de confirmación para cambiar estado */}
        {showStatusConfirm && selectedAlbum && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-black/90 border border-white/10 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-white text-lg font-bold mb-2">
                Confirmar acción
              </h3>
              <p className="text-white/60 text-sm mb-4">
                ¿Estás seguro de cambiar el estado de "
                <span className="text-white">{selectedAlbum.album_name}</span>"
                a{' '}
                <span className="text-[#f5576c] font-bold">{statusAction}</span>
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleStatusChange(selectedAlbum.id, statusAction)
                  }
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl font-bold hover:scale-[1.02] transition-all"
                >
                  Sí, cambiar
                </button>
                <button
                  onClick={() => {
                    setShowStatusConfirm(false);
                    setSelectedAlbum(null);
                    setStatusAction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        {showDeleteConfirm && selectedAlbum && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-black/90 border border-red-500/20 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-white text-lg font-bold mb-2 flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                Eliminar álbum
              </h3>
              <p className="text-white/60 text-sm mb-4">
                ¿Estás seguro de eliminar "
                <span className="text-white">{selectedAlbum.album_name}</span>"
                de {selectedAlbum.artist_name}?
                <br />
                <span className="text-red-400/60 text-xs">
                  Esta acción no se puede deshacer.
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteAlbum(selectedAlbum.id)}
                  className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-all"
                >
                  🗑️ Eliminar
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedAlbum(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
