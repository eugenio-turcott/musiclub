// src/components/LanguageSelector.jsx
import React, { useState, useEffect, useRef } from 'react';

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇲🇽', short: 'ES' },
  { code: 'en', name: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', short: 'PT' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', short: 'FR' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', short: 'DE' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', short: 'IT' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', short: 'JA' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', short: 'KO' },
  { code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳', short: 'ZH' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', short: 'RU' },
];

function getCookie(name) {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : null;
}

function setLanguageCookie(langCode) {
  const domain = window.location.hostname;
  const cookieVal = `/es/${langCode}`;
  
  // Set for root path and specific hostnames
  document.cookie = `googtrans=${cookieVal}; path=/;`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain};`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;
  try {
    localStorage.setItem('musiclub_selected_lang', langCode);
  } catch (e) {}
}

export function LanguageSelector({ variant = 'header' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('es');
  const dropdownRef = useRef(null);

  // Inicializar el script de Google Translate solo una vez
  useEffect(() => {
    // Detectar idioma actual desde cookie o storage
    const saved = (() => {
      try {
        return localStorage.getItem('musiclub_selected_lang');
      } catch (e) {
        return null;
      }
    })();
    const cookie = getCookie('googtrans');
    let active = 'es';
    if (cookie) {
      const parts = cookie.split('/');
      if (parts.length >= 3 && parts[2]) {
        active = parts[2];
      }
    } else if (saved) {
      active = saved;
    }
    setCurrentLang(active);

    // Inyectar estilos para limpiar cualquier artefacto visual de Google Translate
    if (!document.getElementById('google-translate-clean-styles')) {
      const style = document.createElement('style');
      style.id = 'google-translate-clean-styles';
      style.innerHTML = `
        body { top: 0px !important; position: static !important; }
        .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame, iframe.goog-te-banner-frame { display: none !important; }
        .goog-te-gadget, #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        .skiptranslate { display: none !important; }
        #google_translate_element { display: none !important; }
      `;
      document.head.appendChild(style);
    }

    // Inicializar callback global de Google Translate
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'es',
            includedLanguages: 'es,en,pt,fr,de,it,ja,ko,zh-CN,ru',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    // Cargar script si no existe
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  const handleSelectLanguage = (langCode) => {
    setIsOpen(false);
    if (langCode === currentLang) return;

    setCurrentLang(langCode);
    setLanguageCookie(langCode);

    // Intentar cambiar mediante el combo select de Google Translate
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      // Si el script aún no insertó el select, recargamos con la cookie ya configurada
      window.location.reload();
    }
  };

  const activeObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ||
    SUPPORTED_LANGUAGES[0];

  if (variant === 'footer') {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <div id="google_translate_element" style={{ display: 'none' }} />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-all cursor-pointer font-medium"
          aria-label="Cambiar idioma / Change language"
        >
          <span>🌐</span>
          <span>{activeObj.flag} {activeObj.name}</span>
          <span className="text-[10px] text-slate-500">▼</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#121324] border border-cyan-500/30 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn divide-y divide-white/5">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Idioma / Language
            </div>
            <div className="py-1 max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {isSelected && <span className="text-cyan-400 text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Header Variant (Compact Cyberpunk Pill)
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div id="google_translate_element" style={{ display: 'none' }} />
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-8 sm:h-9 px-2.5 sm:px-3 flex items-center gap-1.5 sm:gap-2 rounded-full border transition-all duration-200 cursor-pointer select-none text-xs font-semibold ${
          isOpen
            ? 'bg-[#181a2f] border-cyan-500/60 ring-2 ring-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            : 'bg-[#121324]/80 hover:bg-[#1a1b32] border-white/15 hover:border-white/30 text-white/90 hover:text-white shadow-md hover:scale-105 active:scale-95'
        }`}
        title="Cambiar idioma / Change language"
        aria-label="Seleccionar idioma"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{activeObj.flag}</span>
        <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-cyan-300">
          {activeObj.short}
        </span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-52 bg-[#121324]/95 border border-cyan-500/30 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 animate-fadeIn">
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>🌐</span> Idioma / Language
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">10 Idiomas</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 py-1 custom-scrollbar">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </span>
                  {isSelected ? (
                    <span className="text-cyan-400 text-xs font-black">✓</span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">{lang.short}</span>
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

export default LanguageSelector;
