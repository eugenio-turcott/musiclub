import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  triggerReTranslate,
  protectMusicAndStatsElements,
  scheduleUniversalTranslation,
} from '../utils/translateCrashGuard';

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇲🇽', short: 'ES', isOriginal: true },
  { code: 'en', name: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', short: 'PT' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', short: 'FR' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', short: 'DE' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', short: 'IT' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', short: 'NL' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', short: 'TR' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', short: 'JA' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', short: 'KO' },
  { code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳', short: 'ZH' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', short: 'RU' },
];

function getCookie(name) {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : null;
}

function clearGoogleTranslateCookies() {
  const hostname = window.location.hostname;
  const domainParts = hostname.split('.');
  const domains = [
    hostname,
    '.' + hostname,
    domainParts.length > 1 ? '.' + domainParts.slice(-2).join('.') : '',
    '',
  ];
  const paths = ['/', '/es', ''];

  domains.forEach((dom) => {
    paths.forEach((p) => {
      const dAttr = dom ? `; domain=${dom}` : '';
      const pAttr = `; path=${p || '/'}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC${pAttr}${dAttr}`;
    });
  });
}

function setLanguageCookie(langCode) {
  if (langCode === 'es') {
    clearGoogleTranslateCookies();
    try {
      localStorage.setItem('musiclub_selected_lang', 'es');
    } catch (e) {}
    return;
  }

  const domain = window.location.hostname;
  const cookieVal = `/es/${langCode}`;

  document.cookie = `googtrans=${cookieVal}; path=/;`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain};`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;

  try {
    localStorage.setItem('musiclub_selected_lang', langCode);
  } catch (e) {}
}

// Detección automática no invasiva por navegador y timezone SIN pedir permisos
function detectRecommendedLanguage() {
  try {
    // 1. Si el usuario ya seleccionó manualmente un idioma antes, respetarlo
    const saved = localStorage.getItem('musiclub_selected_lang');
    if (saved) return saved;

    // 2. Cookie existente de sesión anterior
    const cookie = getCookie('googtrans');
    if (cookie) {
      const parts = cookie.split('/');
      if (parts.length >= 3 && parts[2]) {
        return parts[2];
      }
    }

    // 3. Detección automática no invasiva por navegador
    const navLanguages = navigator.languages || [navigator.language || ''];
    for (const raw of navLanguages) {
      const l = (raw || '').toLowerCase();
      if (l.startsWith('es')) return 'es';
      if (l.startsWith('en')) return 'en';
      if (l.startsWith('pt')) return 'pt';
      if (l.startsWith('fr')) return 'fr';
      if (l.startsWith('de')) return 'de';
      if (l.startsWith('it')) return 'it';
      if (l.startsWith('nl')) return 'nl';
      if (l.startsWith('tr')) return 'tr';
      if (l.startsWith('ja')) return 'ja';
      if (l.startsWith('ko')) return 'ko';
      if (l.startsWith('zh')) return 'zh-CN';
      if (l.startsWith('ru')) return 'ru';
    }

    // 4. Detección por Timezone (Sin permisos requeridos)
    const tz = (
      Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    ).toLowerCase();
    if (
      tz.includes('mexico') ||
      tz.includes('bogota') ||
      tz.includes('buenos_aires') ||
      tz.includes('santiago') ||
      tz.includes('lima') ||
      tz.includes('caracas') ||
      tz.includes('madrid') ||
      tz.includes('costa_rica') ||
      tz.includes('guatemala') ||
      tz.includes('panama') ||
      tz.includes('havana') ||
      tz.includes('santo_domingo') ||
      tz.includes('montevideo') ||
      tz.includes('asuncion') ||
      tz.includes('la_paz')
    ) {
      return 'es';
    }
    if (
      tz.includes('sao_paulo') ||
      tz.includes('lisbon') ||
      tz.includes('brasilia')
    )
      return 'pt';
    if (tz.includes('paris') || tz.includes('brussels')) return 'fr';
    if (tz.includes('berlin') || tz.includes('vienna') || tz.includes('zurich'))
      return 'de';
    if (tz.includes('rome')) return 'it';
    if (tz.includes('amsterdam')) return 'nl';
    if (tz.includes('istanbul')) return 'tr';
    if (tz.includes('tokyo')) return 'ja';
    if (tz.includes('seoul')) return 'ko';
    if (
      tz.includes('shanghai') ||
      tz.includes('taipei') ||
      tz.includes('hong_kong') ||
      tz.includes('beijing')
    )
      return 'zh-CN';
    if (
      tz.includes('moscow') ||
      tz.includes('yekaterinburg') ||
      tz.includes('novosibirsk')
    )
      return 'ru';
    if (
      tz.includes('new_york') ||
      tz.includes('chicago') ||
      tz.includes('los_angeles') ||
      tz.includes('london') ||
      tz.includes('toronto') ||
      tz.includes('sydney')
    ) {
      return 'en';
    }
  } catch (e) {
    console.warn('Auto language detection notice:', e);
  }
  return 'es';
}

export function LanguageSelector({ variant = 'header' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('es');
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Inicializar detección de idioma y motor de traducción
  useEffect(() => {
    const recommended = detectRecommendedLanguage();
    const saved = (() => {
      try {
        return localStorage.getItem('musiclub_selected_lang');
      } catch (e) {
        return null;
      }
    })();

    // Si es primera visita y se recomienda un idioma extranjero, auto-activar
    if (!saved && recommended !== 'es') {
      setLanguageCookie(recommended);
    } else if (recommended === 'es' && !saved) {
      clearGoogleTranslateCookies();
    }

    setCurrentLang(saved || recommended || 'es');

    // Inyectar estilos para limpiar artefactos y proteger nombres musicales
    if (!document.getElementById('google-translate-clean-styles')) {
      const style = document.createElement('style');
      style.id = 'google-translate-clean-styles';
      style.innerHTML = `
        body { top: 0px !important; position: static !important; }
        .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame, iframe.goog-te-banner-frame { display: none !important; }
        .goog-te-gadget, #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        .skiptranslate { display: none !important; }
        #google_translate_element { position: absolute !important; left: -9999px !important; top: -9999px !important; width: 1px !important; height: 1px !important; opacity: 0 !important; pointer-events: none !important; overflow: hidden !important; }
        .notranslate, [translate="no"], [translate="no"] * {
          -webkit-user-modify: read-only;
        }
      `;
      document.head.appendChild(style);
    }

    protectMusicAndStatsElements();
    const observer = new MutationObserver(() => {
      protectMusicAndStatsElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Cerrar al hacer click fuera o presionar escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectLanguage = useCallback(
    (langCode) => {
      setIsOpen(false);
      setSearchTerm('');

      // CASO 1: Español (Original) -> NUNCA traduce, limpia cookies y restaura el DOM original
      if (langCode === 'es') {
        clearGoogleTranslateCookies();
        try {
          localStorage.setItem('musiclub_selected_lang', 'es');
        } catch (e) {}
        setCurrentLang('es');

        scheduleUniversalTranslation(0, 'es');

        // Si la página tenía modificaciones de Google Translate o cookies activas, recargar limpiamente para DOM nativo
        const hadTranslation =
          document.documentElement.classList.contains('translated-ltr') ||
          document.documentElement.classList.contains('translated-rtl') ||
          Boolean(getCookie('googtrans')) ||
          Boolean(document.querySelector('.goog-te-banner-frame'));

        if (hadTranslation) {
          window.location.reload();
        }
        return;
      }

      // CASO 2: Idioma extranjero seleccionado
      setCurrentLang(langCode);
      setLanguageCookie(langCode);
      triggerReTranslate(langCode);
    },
    []
  );

  const activeObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ||
    SUPPORTED_LANGUAGES[0];

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      lang.name.toLowerCase().includes(term) ||
      lang.short.toLowerCase().includes(term) ||
      lang.code.toLowerCase().includes(term)
    );
  });

  // =========================================================================
  // FOOTER VARIANT
  // =========================================================================
  if (variant === 'footer') {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-all cursor-pointer font-medium shadow-sm hover:scale-105 active:scale-95"
          aria-label="Cambiar idioma / Change language"
        >
          <span>🌐</span>
          <span>
            {activeObj.flag} {activeObj.name}
          </span>
          <span className="text-[10px] text-slate-500">▼</span>
        </button>

        {/* Backdrop en pantallas chicas */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[150] sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        {isOpen && (
          <div className="fixed left-3 right-3 bottom-16 z-[160] sm:fixed-none sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:bottom-full sm:mb-2 sm:w-64 max-w-[calc(100vw-1.5rem)] bg-[#0c0e1c]/98 border border-cyan-500/40 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl animate-fadeIn divide-y divide-white/10 space-y-1.5 text-left">
            <div className="flex items-center justify-between pb-1 px-1">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>🌐</span> Idioma / Language
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="py-1 max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLang;
                const isOriginal = lang.code === 'es';
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-base">{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                      {isOriginal && (
                        <span className="text-[8px] text-pink-400 font-mono uppercase bg-pink-500/10 px-1 rounded">
                          Original
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <span className="text-cyan-400 text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // HEADER VARIANT (Responsive Popover)
  // =========================================================================
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-8 sm:h-9 px-2 sm:px-2.5 flex items-center gap-1.5 rounded-full border transition-all duration-200 cursor-pointer select-none text-xs font-semibold ${
          isOpen
            ? 'bg-[#181a2f] border-cyan-500/60 ring-2 ring-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            : 'bg-[#121324]/80 hover:bg-[#1a1b32] border-white/15 hover:border-white/30 text-white/90 hover:text-white shadow-md hover:scale-105 active:scale-95'
        }`}
        title="Cambiar idioma / Change language"
        aria-label="Seleccionar idioma"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{activeObj.flag}</span>
        <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-cyan-300 font-bold">
          {activeObj.short}
        </span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Backdrop para cerrar en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[150] sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Popover / Dropdown Menu - Responsivo en Móvil y Desktop */}
      {isOpen && (
        <div className="fixed left-2 right-2 top-[58px] z-[160] sm:fixed-none sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 max-w-[calc(100vw-1rem)] sm:max-w-none bg-[#0c0e1c]/95 border border-cyan-500/40 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-2xl animate-fadeIn flex flex-col space-y-2 text-left">
          {/* Cabecera Responsiva */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-base">🌐</span>
              <span className="text-xs sm:text-sm font-bold text-white">
                Idioma / Language
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {SUPPORTED_LANGUAGES.length} Idiomas
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer transition-all"
                title="Cerrar selector de idiomas"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Buscador rápido de idioma */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar idioma / Search language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lista de Idiomas */}
          <div className="max-h-[55vh] sm:max-h-72 overflow-y-auto space-y-1 py-1 custom-scrollbar pr-0.5">
            {filteredLanguages.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400">
                No se encontró ningún idioma.
              </p>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === currentLang;
                const isOriginal = lang.code === 'es';
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-purple-500/20 text-cyan-200 font-bold border border-cyan-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg leading-none">{lang.flag}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">
                          {lang.name}
                        </span>
                        {isOriginal && (
                          <span className="text-[9px] text-pink-400/90 font-mono font-bold">
                            ★ Versión Original
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isSelected && (
                        <span className="text-cyan-400 text-xs font-black">
                          ✓
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {lang.short}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
