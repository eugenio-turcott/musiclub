// src/components/ReviewInteractions.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { supabaseService } from '../services/supabaseClient';
import {
  QUICK_REACTIONS,
  normalizeReactionEmoji,
  addRecentEmoji,
} from '../utils/emojiData';
import { WhatsAppEmojiPicker } from './WhatsAppEmojiPicker';

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
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} d`;

    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export function ReviewInteractions({
  reviewId,
  albumId = null,
  currentUser = null,
  reviewerEmail = null,
  reviewerName = null,
  className = '',
  initialInteractions = null,
}) {
  const [reactions, setReactions] = useState(
    initialInteractions?.reactions || []
  );
  const [comments, setComments] = useState(initialInteractions?.comments || []);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isQuickDockOpen, setIsQuickDockOpen] = useState(false);
  const [isFullPickerOpen, setIsFullPickerOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [authNotice, setAuthNotice] = useState(null);
  const dockRef = useRef(null);
  const commentInputRef = useRef(null);

  // Cerrar barra rápida al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setIsQuickDockOpen(false);
      }
    }
    if (isQuickDockOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isQuickDockOpen]);

  // Cargar interacciones si no se proveyeron inicialmente
  const loadInteractions = useCallback(async () => {
    if (!reviewId) return;
    try {
      const data = await supabaseService.getReviewInteractions({
        reviewIds: [reviewId],
        albumId,
      });
      if (data) {
        const revReactions = (data.reactions || []).filter(
          (r) => String(r.review_id) === String(reviewId)
        );
        const revComments = (data.comments || []).filter(
          (c) => String(c.review_id) === String(reviewId)
        );
        setReactions(revReactions);
        setComments(revComments);
      }
    } catch (err) {
      console.warn('Error al cargar interacciones de review:', err);
    }
  }, [reviewId, albumId]);

  useEffect(() => {
    if (!initialInteractions) {
      loadInteractions();
    }
  }, [reviewId, loadInteractions, initialInteractions]);

  // Mostrar mensaje temporal de requerimiento de autenticación
  const notifyAuthRequired = (message) => {
    setAuthNotice(message);
    setTimeout(() => {
      setAuthNotice(null);
    }, 3500);
  };

  const currentEmail = currentUser?.email?.toLowerCase()?.trim() || null;

  // Agrupación de reacciones dinámicas por cualquier emoji UTF-8 (soporta WhatsApp style)
  const groupedReactions = useMemo(() => {
    const map = {};

    reactions.forEach((r) => {
      const emoji = normalizeReactionEmoji(r.reaction_type);
      if (!map[emoji]) {
        map[emoji] = {
          emoji,
          count: 0,
          userReacted: false,
          users: [],
        };
      }
      map[emoji].count += 1;
      map[emoji].users.push(r.user_name || 'Alguien');

      if (
        currentEmail &&
        r.user_email?.toLowerCase()?.trim() === currentEmail
      ) {
        map[emoji].userReacted = true;
      }
    });

    return map;
  }, [reactions, currentEmail]);

  // Lista ordenada de reacciones con votos
  const activeReactions = useMemo(() => {
    return Object.values(groupedReactions).sort((a, b) => b.count - a.count);
  }, [groupedReactions]);

  // Emojis que el usuario actual tiene activos
  const currentUserReactionEmojis = useMemo(() => {
    return Object.values(groupedReactions)
      .filter((r) => r.userReacted)
      .map((r) => r.emoji);
  }, [groupedReactions]);

  // Alternar una reacción con CUALQUIER emoji (Optimistic UI)
  const handleToggleReaction = async (reactionInput) => {
    const reactionEmoji = normalizeReactionEmoji(reactionInput);
    if (!currentUser) {
      notifyAuthRequired(
        'Inicia sesión en Musiclub para reaccionar a esta reseña 🎧'
      );
      setIsQuickDockOpen(false);
      setIsFullPickerOpen(false);
      return;
    }

    setIsQuickDockOpen(false);
    setIsFullPickerOpen(false);

    const isCurrentlyReacted = groupedReactions[reactionEmoji]?.userReacted;
    const currentUserName =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.name ||
      (currentEmail ? currentEmail.split('@')[0] : 'Melómano');

    // 1. Actualización optimista local
    setReactions((prev) => {
      if (isCurrentlyReacted) {
        return prev.filter(
          (r) =>
            !(
              normalizeReactionEmoji(r.reaction_type) === reactionEmoji &&
              r.user_email?.toLowerCase()?.trim() === currentEmail
            )
        );
      } else {
        const optimisticReaction = {
          id: `opt-react-${Date.now()}`,
          review_id: reviewId,
          album_id: albumId,
          user_id: currentUser.id || null,
          user_email: currentEmail,
          user_name: currentUserName,
          reaction_type: reactionEmoji,
          created_at: new Date().toISOString(),
        };
        return [...prev, optimisticReaction];
      }
    });

    // Guardar en la lista de recientes de WhatsApp para tenerlo a mano
    addRecentEmoji(reactionEmoji);

    // 2. Persistir en Supabase / Backend
    try {
      await supabaseService.toggleReviewReaction({
        review_id: reviewId,
        album_id: albumId,
        user: currentUser,
        reaction_type: reactionEmoji,
      });
    } catch (err) {
      console.error('Error al guardar reacción:', err);
      // Revertir en caso de fallo
      loadInteractions();
    }
  };

  // Enviar comentario nuevo
  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    if (!currentUser) {
      notifyAuthRequired('Inicia sesión para unirte a la conversación 💬');
      return;
    }

    const textToSubmit = commentText.trim();
    setCommentText('');
    setSubmittingComment(true);

    const tempComment = {
      id: `opt-comm-${Date.now()}`,
      review_id: reviewId,
      album_id: albumId,
      user_id: currentUser.id || null,
      user_email: currentEmail,
      user_name:
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.name ||
        (currentEmail ? currentEmail.split('@')[0] : 'Melómano'),
      user_avatar:
        currentUser.user_metadata?.avatar_url ||
        currentUser.user_metadata?.picture ||
        currentUser.avatar_url ||
        null,
      comment: textToSubmit,
      created_at: new Date().toISOString(),
    };

    // Actualización optimista
    setComments((prev) => [...prev, tempComment]);

    try {
      const saved = await supabaseService.addReviewComment({
        review_id: reviewId,
        album_id: albumId,
        user: currentUser,
        comment: textToSubmit,
      });

      if (saved && saved.id) {
        setComments((prev) =>
          prev.map((c) => (c.id === tempComment.id ? saved : c))
        );
      }
    } catch (err) {
      console.error('Error al agregar comentario:', err);
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      notifyAuthRequired(
        'Hubo un error al publicar el comentario. Intenta nuevamente.'
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  // Eliminar comentario
  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;
    if (!window.confirm('¿Deseas eliminar este comentario?')) return;

    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      await supabaseService.deleteReviewComment(commentId, currentEmail);
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
      loadInteractions();
    }
  };

  return (
    <div className={`pt-2.5 border-t border-white/5 space-y-2.5 ${className}`}>
      {/* Alerta de autenticación contextual */}
      {authNotice && (
        <div className="text-xs bg-pink-500/15 border border-pink-500/30 text-pink-200 px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-1.5">
            <span>🔒</span>
            <span>{authNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAuthNotice(null)}
            className="text-pink-300 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Acciones: Reacciones + Botón de Comentarios */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Pills de reacciones activas y botón de agregar reacción */}
        <div
          className="flex items-center gap-1.5 flex-wrap relative"
          ref={dockRef}
        >
          {/* Pills con cuenta de cada reacción activa (cualquier emoji) */}
          {activeReactions.map((rData) => (
            <button
              key={rData.emoji}
              type="button"
              onClick={() => handleToggleReaction(rData.emoji)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all border select-none active:scale-95 ${
                rData.userReacted
                  ? 'bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/50 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.25)] ring-1 ring-pink-500/30'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title={
                rData.users.length > 0
                  ? `${rData.users.slice(0, 5).join(', ')}${
                      rData.users.length > 5
                        ? ` y ${rData.users.length - 5} más`
                        : ''
                    } (Haz clic para alternar)`
                  : 'Reacción'
              }
            >
              <span className="text-sm">{rData.emoji}</span>
              <span className="text-[11px] font-mono">{rData.count}</span>
            </button>
          ))}

          {/* Botón para desplegar la barra rápida estilo WhatsApp */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsQuickDockOpen((prev) => !prev);
                setIsFullPickerOpen(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
              title="Reaccionar con cualquier emoji"
            >
              <span>✨</span>
              <span className="text-[11px]">
                {activeReactions.length === 0 ? 'Reaccionar' : '+'}
              </span>
            </button>

            {/* Barra flotante estilo Facebook + Dislike con botón '+' estilo WhatsApp */}
            {isQuickDockOpen && (
              <div className="absolute left-0 bottom-full mb-2 z-50 flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-full bg-[#141628]/95 backdrop-blur-2xl border border-white/20 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.8),0_0_20px_rgba(236,72,153,0.15)] animate-scaleUp max-w-[92vw] overflow-x-auto no-scrollbar">
                {QUICK_REACTIONS.map((qDef) => {
                  const isReacted = groupedReactions[qDef.emoji]?.userReacted;
                  return (
                    <button
                      key={qDef.emoji}
                      type="button"
                      onClick={() => handleToggleReaction(qDef.emoji)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-lg sm:text-xl hover:scale-125 transition-transform duration-150 active:scale-95 flex-shrink-0 ${
                        isReacted
                          ? 'bg-pink-500/25 border border-pink-500/40 shadow-sm'
                          : 'hover:bg-white/10'
                      }`}
                      title={`${qDef.emoji} ${qDef.label}`}
                    >
                      <span className="leading-none">{qDef.emoji}</span>
                    </button>
                  );
                })}

                {/* Separador vertical */}
                <div className="h-5 w-px bg-white/20 mx-0.5 flex-shrink-0" />

                {/* Botón WhatsApp '+' para abrir el selector completo con buscador */}
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickDockOpen(false);
                    setIsFullPickerOpen(true);
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base hover:scale-115 bg-white/5 hover:bg-white/15 text-cyan-300 hover:text-white border border-white/15 transition-all active:scale-95 flex-shrink-0"
                  title="Más emojis (WhatsApp style con buscador y categorías) ➕"
                >
                  ➕
                </button>
              </div>
            )}

            {/* Selector completo de WhatsApp con buscador y categorías */}
            <WhatsAppEmojiPicker
              isOpen={isFullPickerOpen}
              onClose={() => setIsFullPickerOpen(false)}
              onSelectEmoji={handleToggleReaction}
              userCurrentReactions={currentUserReactionEmojis}
              anchorRef={dockRef}
            />
          </div>
        </div>

        {/* Botón para abrir / cerrar comentarios */}
        <button
          type="button"
          onClick={() => {
            setIsCommentsOpen((prev) => !prev);
            if (!isCommentsOpen) {
              setTimeout(() => {
                commentInputRef.current?.focus();
              }, 100);
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border select-none active:scale-95 ${
            isCommentsOpen || comments.length > 0
              ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30 shadow-sm'
              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border-white/5'
          }`}
          title="Ver o agregar comentarios a esta reseña"
        >
          <span>💬</span>
          <span>
            {comments.length > 0
              ? `${comments.length} ${comments.length === 1 ? 'comentario' : 'comentarios'}`
              : 'Comentar'}
          </span>
          <span className="text-[10px] opacity-70">
            {isCommentsOpen ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {/* Cajón desplegable de Comentarios */}
      {isCommentsOpen && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-fadeIn">
          {/* Lista de comentarios existentes */}
          {comments.length === 0 ? (
            <div className="py-3 px-4 rounded-xl bg-black/20 border border-white/5 text-center text-slate-400 text-xs">
              <span className="text-base mr-1">💬</span>
              <span>
                Aún no hay comentarios en esta reseña. ¡Inicia la conversación!
              </span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {comments.map((comm) => {
                const isCommentAuthor = Boolean(
                  currentEmail &&
                  comm.user_email?.toLowerCase()?.trim() === currentEmail
                );
                const isReviewerComment = Boolean(
                  (reviewerEmail &&
                    comm.user_email?.toLowerCase()?.trim() ===
                      reviewerEmail.toLowerCase().trim()) ||
                  (reviewerName &&
                    comm.user_name?.toLowerCase()?.trim() ===
                      reviewerName.toLowerCase().trim())
                );

                const authorInitial = (
                  (comm.user_name || comm.user_email || 'U')[0] || 'U'
                ).toUpperCase();

                return (
                  <div
                    key={comm.id}
                    className="p-3 rounded-xl bg-black/35 hover:bg-black/50 border border-white/5 hover:border-white/10 transition-all space-y-1.5 group/comment"
                  >
                    {/* Cabecera del comentario */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {comm.user_avatar ? (
                          <img
                            src={comm.user_avatar}
                            alt={comm.user_name || 'Usuario'}
                            className="w-5 h-5 rounded-full object-cover border border-white/15 flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling)
                                e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-white items-center justify-center font-bold text-[9px] shadow-sm flex-shrink-0 ${
                            comm.user_avatar ? 'hidden' : 'flex'
                          }`}
                        >
                          {authorInitial}
                        </div>

                        <span
                          translate="no"
                          className="notranslate text-xs font-bold text-slate-200 truncate"
                        >
                          {comm.user_name || 'Melómano'}
                        </span>

                        {isReviewerComment && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold flex-shrink-0">
                            ✍️ Autor
                          </span>
                        )}

                        <span className="text-white/20 text-[10px]">•</span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {formatTimeAgo(comm.created_at)}
                        </span>
                      </div>

                      {/* Botón para eliminar si es comentario propio */}
                      {isCommentAuthor && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comm.id)}
                          className="text-slate-500 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover/comment:opacity-100 transition-opacity"
                          title="Eliminar este comentario"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* Texto del comentario */}
                    <p className="text-xs text-slate-300 leading-relaxed pl-7 break-words whitespace-pre-wrap">
                      {comm.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulario para agregar nuevo comentario */}
          {currentUser ? (
            <form
              onSubmit={handleAddComment}
              className="flex gap-2 items-start pt-1"
            >
              <div className="flex-1 min-w-0">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  rows={1}
                  placeholder="Escribe una respuesta o comentario a esta reseña..."
                  disabled={submittingComment}
                  className="w-full bg-black/40 text-xs text-white placeholder-slate-500 px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 resize-none transition-all leading-relaxed"
                />
                <span className="text-[9px] text-slate-500 block pl-1 pt-0.5">
                  Presiona Enter para enviar • Shift + Enter para salto de línea
                </span>
              </div>

              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex-shrink-0 flex items-center gap-1.5"
              >
                {submittingComment ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enviar</span>
                    <span>➔</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>🔒</span>
              <span>
                <strong className="text-white">Inicia sesión</strong> para
                comentar y responder a esta reseña.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
