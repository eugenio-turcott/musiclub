// src/components/NotificationsDropdown.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Helper de formato de tiempo relativo
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Justo ahora';

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} d`;

    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export function NotificationsDropdown({
  notifications = [],
  unreadCount = 0,
  loading = false,
  isRead = () => false,
  markAsRead = () => {},
  markAllAsRead = () => {},
  deleteNotification = () => {},
  clearAllNotifications = () => {},
  refreshNotifications = () => {},
  onClose = () => {},
}) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  // Manejar clic en una notificación
  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    onClose();
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Manejar eliminación individual
  const handleDeleteItem = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      deleteNotification(id);
      setDeletingId(null);
    }, 200);
  };

  // Manejar limpiar todas
  const handleClearAll = (e) => {
    e.stopPropagation();
    if (notifications.length === 0) return;
    if (window.confirm('¿Deseas eliminar todas las notificaciones?')) {
      clearAllNotifications();
    }
  };

  return (
    <div
      className="fixed left-2 right-2 top-[58px] z-[160] sm:fixed-none sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[440px] bg-[#0c0e1c]/95 backdrop-blur-2xl border border-pink-500/30 sm:border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left animate-fadeIn max-h-[80vh] sm:max-h-[540px]"
      role="dialog"
      aria-label="Centro de Notificaciones"
    >
      {/* 1. CABECERA */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Bloque de Título y campana */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center text-sm flex-shrink-0 shadow-inner">
            🔔
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <span className="bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/40 truncate">
              Buzón, reseñas y ganadores del club
            </p>
          </div>
        </div>

        {/* Botones de acción cabecera (debajo del bloque de título en móvil / sm, a la derecha en escritorio) */}
        <div className="flex items-center justify-end gap-1.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/25 px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 cursor-pointer"
              title="Marcar todas como leídas"
            >
              <span>✓</span>
              <span>Leídas</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-white/60 hover:text-rose-300 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 p-1.5 px-2 rounded-lg transition-all font-medium flex items-center gap-1 cursor-pointer"
              title="Eliminar todas las notificaciones"
            >
              <span>🗑️</span>
              <span className="sm:hidden text-[10px]">Limpiar</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center text-xs transition-all border border-white/10 cursor-pointer ml-auto sm:ml-0"
            title="Cerrar notificaciones"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. LISTA DE NOTIFICACIONES */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-2 divide-y divide-white/[0.04]">
        {loading && notifications.length === 0 ? (
          <div className="py-12 text-center text-white/50 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Cargando notificaciones...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 px-4 text-center text-white/40 text-xs flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">📭</span>
            <span className="font-semibold text-white/70 text-sm">
              No tienes notificaciones pendientes
            </span>
            <p className="text-[11px] text-white/40 max-w-xs">
              Te avisaremos cuando recibas canciones en tu buzón, califiquen tus
              álbumes o haya un ganador.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const read = isRead(item.id);
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3 select-none ${
                  isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                } ${
                  read
                    ? 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5'
                    : 'bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-transparent hover:bg-pink-500/15 border-pink-500/30 shadow-[0_0_15px_rgba(245,87,108,0.08)]'
                }`}
              >
                {/* Indicador de no leído */}
                {!read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-pink-400 animate-pulse shadow-[0_0_8px_rgba(244,114,182,0.8)]"></span>
                )}

                {/* Avatar / Portada / Icono */}
                <div className="relative flex-shrink-0 mt-0.5">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-10 h-10 rounded-xl object-cover border border-white/15 shadow-md group-hover:border-pink-500/40 transition-colors"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling)
                          e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.badgeColor} text-white flex items-center justify-center text-lg shadow-md ${
                      item.image ? 'hidden' : 'flex'
                    }`}
                  >
                    {item.icon}
                  </div>
                  {/* Badge de icono superpuesto si hay imagen */}
                  {item.image && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-[9px]">
                      {item.icon}
                    </div>
                  )}
                </div>

                {/* Contenido de la notificación */}
                <div className="min-w-0 flex-1 pr-6">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                        item.type === 'mailbox'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : item.type === 'review'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="text-[10px] text-white/40">
                      • {formatTimeAgo(item.dateFormatted)}
                    </span>
                  </div>

                  <h4
                    className={`text-xs font-bold leading-snug line-clamp-1 ${
                      read ? 'text-white/85' : 'text-white font-extrabold'
                    }`}
                  >
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Botón individual de eliminar (X) */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(e, item.id)}
                  className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-lg bg-white/5 hover:bg-rose-500/25 text-white/30 hover:text-rose-300 flex items-center justify-center text-xs transition-all border border-transparent hover:border-rose-500/30"
                  title="Eliminar esta notificación"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 3. PIE DE PÁGINA */}
      <div className="p-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-white/40 px-3.5">
        <span>Se actualiza automáticamente</span>
        <button
          type="button"
          onClick={() => refreshNotifications()}
          className="text-pink-300 hover:text-white transition-colors flex items-center gap-1 font-semibold cursor-pointer"
        >
          <span>🔄</span>
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  );
}
