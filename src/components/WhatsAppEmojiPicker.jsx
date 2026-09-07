// src/components/WhatsAppEmojiPicker.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  EMOJI_CATEGORIES,
  getRecentEmojis,
  addRecentEmoji,
  searchEmojis,
} from '../utils/emojiData';

export function WhatsAppEmojiPicker({
  isOpen,
  onClose,
  onSelectEmoji,
  userCurrentReactions = [],
  anchorRef = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('recent');
  const [recentList, setRecentList] = useState([]);
  const pickerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Cargar emojis recientes
  useEffect(() => {
    if (isOpen) {
      setRecentList(getRecentEmojis());
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Cerrar al presionar Escape o hacer click fuera
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    function handleClickOutside(e) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  // Manejar búsqueda
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchEmojis(searchQuery);
  }, [searchQuery]);

  const handlePickEmoji = (emoji) => {
    addRecentEmoji(emoji);
    onSelectEmoji(emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 z-50 w-72 sm:w-80 max-w-[90vw] bg-[#121424]/95 backdrop-blur-2xl border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl p-3 flex flex-col space-y-2.5 animate-scaleUp select-none text-white text-xs"
      style={{
        boxShadow:
          '0 20px 40px -10px rgba(0,0,0,0.7), 0 0 25px -5px rgba(236,72,153,0.15)',
      }}
    >
      {/* Barra Superior: Buscador y Botón Cerrar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
            🔍
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cualquier emoji..."
            className="w-full bg-black/40 text-xs text-white placeholder-slate-500 pl-8 pr-7 py-1.5 rounded-xl border border-white/10 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px] p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          title="Cerrar selector"
        >
          ✕
        </button>
      </div>

      {/* Pestañas de Categorías (Estilo WhatsApp) */}
      {!searchResults && (
        <div className="flex items-center justify-between border-b border-white/5 pb-1 gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('recent')}
            className={`p-1.5 rounded-lg text-sm transition-all ${
              activeCategory === 'recent'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40 scale-110'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Recientes"
          >
            🕒
          </button>

          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`p-1.5 rounded-lg text-sm transition-all ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40 scale-110'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Cuadrícula de Emojis */}
      <div className="max-h-52 sm:max-h-60 overflow-y-auto custom-scrollbar pr-1 space-y-2">
        {searchResults ? (
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">
              Resultados ({searchResults.length})
            </p>
            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs space-y-1">
                <span>🤷‍♂️</span>
                <p>No se encontraron emojis para "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                {searchResults.map((emoji, idx) => {
                  const isReacted = userCurrentReactions.includes(emoji);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePickEmoji(emoji)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-95 ${
                        isReacted
                          ? 'bg-pink-500/20 border border-pink-500/40'
                          : 'hover:bg-white/10'
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeCategory === 'recent' ? (
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">
              Recientes & Populares
            </p>
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
              {recentList.map((emoji, idx) => {
                const isReacted = userCurrentReactions.includes(emoji);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePickEmoji(emoji)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-95 ${
                      isReacted
                        ? 'bg-pink-500/20 border border-pink-500/40'
                        : 'hover:bg-white/10'
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          (() => {
            const currentCat = EMOJI_CATEGORIES.find(
              (c) => c.id === activeCategory
            );
            if (!currentCat) return null;
            return (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">
                  {currentCat.name}
                </p>
                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                  {currentCat.emojis.map((item, idx) => {
                    const isReacted = userCurrentReactions.includes(item.e);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePickEmoji(item.e)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-95 ${
                          isReacted
                            ? 'bg-pink-500/20 border border-pink-500/40'
                            : 'hover:bg-white/10'
                        }`}
                        title={item.e}
                      >
                        {item.e}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Pie de página sutil estilo WhatsApp */}
      <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
        <span>Toca cualquier emoji para reaccionar</span>
      </div>
    </div>
  );
}
