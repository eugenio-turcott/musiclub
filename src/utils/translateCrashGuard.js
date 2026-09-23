// src/utils/translateCrashGuard.js
/**
 * Monkey-patches DOM Node manipulation methods to prevent Google Translate
 * from crashing React with:
 * "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."
 *
 * Coordinates universal 2-second delay for translations on both initial load/refresh
 * and SPA route changes, ensuring all dynamic data loads in Spanish first.
 */

export function isSearchBotOrCrawler() {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  return (
    Boolean(navigator.webdriver) ||
    ua.includes('googlebot') ||
    ua.includes('google-inspectiontool') ||
    ua.includes('bingbot') ||
    ua.includes('yandex') ||
    ua.includes('baiduspider') ||
    ua.includes('slurp') ||
    ua.includes('duckduckbot') ||
    ua.includes('facebookexternalhit') ||
    ua.includes('twitterbot') ||
    ua.includes('whatsapp') ||
    ua.includes('telegrambot') ||
    ua.includes('applebot') ||
    ua.includes('headlesschrome')
  );
}

export function installTranslateCrashGuard() {
  if (
    typeof window === 'undefined' ||
    typeof Node === 'undefined' ||
    !Node.prototype
  ) {
    return;
  }

  if (window.__translateCrashGuardInstalled) {
    return;
  }
  window.__translateCrashGuardInstalled = true;

  // 1. Guard removeChild
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (!child) return child;
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  // 2. Guard insertBefore
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (!newNode) return newNode;
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode);
      }
      return originalInsertBefore.call(this, newNode, null);
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };

  // 3. Guard replaceChild
  const originalReplaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function (newChild, oldChild) {
    if (!newChild || !oldChild) return oldChild;
    if (oldChild.parentNode !== this) {
      if (oldChild.parentNode) {
        return oldChild.parentNode.replaceChild(newChild, oldChild);
      }
      return this.appendChild(newChild);
    }
    return originalReplaceChild.call(this, newChild, oldChild);
  };
}

// Registro global en memoria de entidades intocables contra traducción (V.8.11)
const knownReleases = new Set();
const knownArtists = new Set();
const knownPeople = new Set();

function normalizeEntity(str) {
  return typeof str === 'string' ? str.trim().toLowerCase() : '';
}

/**
 * Registra entidades conocidas (lanzamientos, artistas, personas) para protegerlas
 * de cualquier motor de traducción (Google Translate, Chrome, Safari, Edge, Firefox).
 */
export function registerUntranslatableEntities({
  releases = [],
  artists = [],
  people = [],
} = {}) {
  let hasNew = false;
  if (Array.isArray(releases)) {
    releases.forEach((r) => {
      const norm = normalizeEntity(r);
      if (norm && norm.length > 1 && !knownReleases.has(norm)) {
        knownReleases.add(norm);
        hasNew = true;
      }
    });
  }
  if (Array.isArray(artists)) {
    artists.forEach((a) => {
      const norm = normalizeEntity(a);
      if (norm && norm.length > 1 && !knownArtists.has(norm)) {
        knownArtists.add(norm);
        hasNew = true;
      }
    });
  }
  if (Array.isArray(people)) {
    people.forEach((p) => {
      const norm = normalizeEntity(p);
      if (norm && norm.length > 1 && !knownPeople.has(norm)) {
        knownPeople.add(norm);
        hasNew = true;
      }
    });
  }

  if (hasNew && typeof document !== 'undefined') {
    protectMusicAndStatsElements();
  }
}

if (typeof window !== 'undefined') {
  window.__registerUntranslatableEntities = registerUntranslatableEntities;
}

const UNTRANSLATABLE_SELECTORS = [
  // Releases / Albums / Songs / Tracks
  '.music-title',
  '.album-name',
  '.release-name',
  '.release-title',
  '.track-name',
  '.song-title',
  '.song-name',
  '.playlist-title',
  '.title-albumes',
  '.text-albumes',
  '[data-album]',
  '[data-album-name]',
  '[data-release]',
  '[data-release-name]',
  '[data-track]',
  '[data-song]',
  '[data-notranslate]',

  // Artists / Bands / Groups / Producers
  '.artist-name',
  '.artist-title',
  '.band-name',
  '[data-artist]',
  '[data-artist-name]',
  'a[href^="/artista/"].artist-name',
  'a[href^="/artist/"].artist-name',
  'a[href^="/artista/"][data-artist]',
  'a[href^="/artist/"][data-artist]',

  // People / Users / Members / Critics / Authors / Curators / Senders / Recipients
  '.username-tag',
  '.user-name',
  '.member-name',
  '.critic-name',
  '.author-name',
  '.curator-name',
  '.reviewer-name',
  '.person-name',
  '.profile-name',
  '.sender-name',
  '.recipient-name',
  '[data-user]',
  '[data-username]',
  '[data-member]',
  '[data-person]',
  'a[href^="/perfil/"]',
  'a[href^="/profile/"]',

  // Musical Brand & Numerical Stats
  '.musiclub-brand',
  '.stat-number',
  '.stat-value',
  '.metric-value',
  '.count-badge',
  '.badge-count',
  '.score-badge',
  '.rating-badge',
  '[data-stat]',
  '[data-metric]',
  '[data-count]',
  '[data-score]',
  '[data-badge]',
].join(', ');

/**
 * Protects musical titles, artist names, track names, usernames, and numerical stats
 * from being mangled or translated by Google Translate or browser translators (Chrome, Safari, Edge).
 */
export function protectMusicAndStatsElements(root = null) {
  if (typeof document === 'undefined') return;
  const targetRoot = root && root.querySelectorAll ? root : document;

  try {
    targetRoot.querySelectorAll(UNTRANSLATABLE_SELECTORS).forEach((el) => {
      if (
        el.getAttribute('data-translatable') === 'true' ||
        el.getAttribute('translate') === 'yes'
      ) {
        return;
      }
      if (el.getAttribute('translate') !== 'no') {
        el.setAttribute('translate', 'no');
      }
      if (!el.classList.contains('notranslate')) {
        el.classList.add('notranslate');
      }
    });

    // Auto-detectar usernames (@username) o textos coincidentes con entidades registradas
    const textNodesTarget = targetRoot.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, span, p, strong, b, a, div, li'
    );
    textNodesTarget.forEach((el) => {
      if (el.getAttribute('translate') === 'no') return;

      // Solo examinar elementos hoja (sin hijos de bloque)
      if (el.children.length === 0 && el.textContent) {
        const rawText = el.textContent.trim();
        if (!rawText) return;

        // Caso 1: Menciona usuario (@...)
        if (rawText.startsWith('@')) {
          el.setAttribute('translate', 'no');
          el.classList.add('notranslate', 'username-tag');
          return;
        }

        // Caso 2: Coincide exactamente con un release, artista o persona registrada
        const norm = rawText.toLowerCase();
        if (
          knownReleases.has(norm) ||
          knownArtists.has(norm) ||
          knownPeople.has(norm)
        ) {
          el.setAttribute('translate', 'no');
          el.classList.add('notranslate');
        }
      }
    });
  } catch (e) {
    // Ignore DOM query issues
  }
}

let isObserverScheduled = false;
let mutationObserverInstance = null;

export function setupUntranslatableObserver() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (mutationObserverInstance || window.__untranslatableObserverInstalled) return;
  window.__untranslatableObserverInstalled = true;

  try {
    mutationObserverInstance = new MutationObserver((mutations) => {
      let shouldProtect = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          shouldProtect = true;
          break;
        }
      }
      if (shouldProtect && !isObserverScheduled) {
        isObserverScheduled = true;
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(() => {
            isObserverScheduled = false;
            protectMusicAndStatsElements();
          });
        } else {
          setTimeout(() => {
            isObserverScheduled = false;
            protectMusicAndStatsElements();
          }, 0);
        }
      }
    });

    const targetNode = document.documentElement || document.body;
    if (targetNode) {
      mutationObserverInstance.observe(targetNode, {
        childList: true,
        subtree: true,
      });
    }

    // Interceptar cambios de URL (SPA navigation)
    const handleNavigation = () => {
      setTimeout(() => {
        protectMusicAndStatsElements();
      }, 50);
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('musiclub:content-loaded', handleNavigation);

    const originalPushState = history.pushState;
    if (originalPushState) {
      history.pushState = function () {
        const ret = originalPushState.apply(this, arguments);
        handleNavigation();
        return ret;
      };
    }
    const originalReplaceState = history.replaceState;
    if (originalReplaceState) {
      history.replaceState = function () {
        const ret = originalReplaceState.apply(this, arguments);
        handleNavigation();
        return ret;
      };
    }
  } catch (err) {
    console.warn('Untranslatable observer warning:', err);
  }
}

export function clearGoogleTranslateCookies() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
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

export function setLanguageCookie(langCode) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!langCode || langCode === 'es') {
    clearGoogleTranslateCookies();
    try {
      localStorage.setItem('musiclub_selected_lang', 'es');
    } catch (e) {}
    return;
  }

  const domain = window.location.hostname;
  const cookieVal = `/es/${langCode}`;

  document.cookie = `googtrans=${cookieVal}; path=/;`;
  if (domain && domain !== 'localhost') {
    document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain};`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;
  }

  try {
    localStorage.setItem('musiclub_selected_lang', langCode);
  } catch (e) {}
}

/**
 * Ensures Google Translate engine script is mounted.
 */
export function ensureGoogleTranslateScriptMounted() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (isSearchBotOrCrawler()) return;

  // Ensure mount container exists
  if (!document.getElementById('google_translate_element')) {
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.cssText =
      'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;';
    document.body.appendChild(div);
  }

  window.googleTranslateElementInit = () => {
    if (window.google && window.google.translate) {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'es',
            includedLanguages: 'es,en,pt,fr,de,it,nl,tr,ja,ko,zh-CN,ru',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      } catch (e) {
        console.warn('Google Translate initialization notice:', e);
      }
    }
  };

  if (!document.getElementById('google-translate-script')) {
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  } else if (
    window.google &&
    window.google.translate &&
    window.googleTranslateElementInit
  ) {
    try {
      window.googleTranslateElementInit();
    } catch (e) {}
  }
}

/**
 * Triggers Google Translate synchronization for the target language.
 */
export function triggerReTranslate(targetLang) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const savedLang =
    targetLang ||
    (() => {
      try {
        return localStorage.getItem('musiclub_selected_lang');
      } catch (e) {
        return 'es';
      }
    })() ||
    'es';

  if (savedLang === 'es') {
    clearGoogleTranslateCookies();
    const combo = document.querySelector('.goog-te-combo');
    if (combo && combo.value !== 'es') {
      combo.value = 'es';
      try {
        const ev = document.createEvent('HTMLEvents');
        ev.initEvent('change', true, true);
        combo.dispatchEvent(ev);
      } catch (e) {
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    return;
  }

  // 1. Set language cookie
  setLanguageCookie(savedLang);

  // 2. Protect musical titles and numbers
  protectMusicAndStatsElements();

  // 3. Ensure script is mounted
  ensureGoogleTranslateScriptMounted();

  // 4. Change combo with retry
  const applyCombo = () => {
    protectMusicAndStatsElements();
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = savedLang;
      try {
        const event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        combo.dispatchEvent(event);
      } catch (e) {
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }
    return false;
  };

  if (!applyCombo()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (applyCombo() || attempts > 35) {
        clearInterval(interval);
      }
    }, 100);
  }
}

let universalTimer = null;

/**
 * Universal translation scheduler:
 * Waits delayMs (default 2000ms), and then translates if needed.
 */
export function scheduleUniversalTranslation(delayMs = 2000, explicitLang = null) {
  if (typeof window === 'undefined') return;

  if (universalTimer) {
    clearTimeout(universalTimer);
    universalTimer = null;
  }

  const langToUse =
    explicitLang ||
    (() => {
      try {
        return localStorage.getItem('musiclub_selected_lang');
      } catch (e) {
        return 'es';
      }
    })() ||
    'es';

  if (langToUse === 'es') {
    clearGoogleTranslateCookies();
    const combo = document.querySelector('.goog-te-combo');
    if (combo && combo.value !== 'es') {
      combo.value = 'es';
      try {
        const ev = document.createEvent('HTMLEvents');
        ev.initEvent('change', true, true);
        combo.dispatchEvent(ev);
      } catch (e) {
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    return;
  }

  setLanguageCookie(langToUse);
  protectMusicAndStatsElements();

  if (delayMs <= 0) {
    triggerReTranslate(langToUse);
    return;
  }

  universalTimer = setTimeout(() => {
    universalTimer = null;
    triggerReTranslate(langToUse);
  }, delayMs);
}

/**
 * Custom event dispatcher to coordinate translations.
 */
export function notifyContentLoaded(sectionName = 'general') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('musiclub:content-loaded', {
      detail: { section: sectionName, timestamp: Date.now() },
    })
  );
}

// Auto-install crash guard & untranslatable observer immediately on module evaluation
installTranslateCrashGuard();
setupUntranslatableObserver();
protectMusicAndStatsElements();

// Initial page load / refresh coordination:
// Si hay un idioma extranjero guardado, esperar exactamente 2 segundos antes de traducir
if (typeof window !== 'undefined' && !isSearchBotOrCrawler()) {
  const initialSavedLang = (() => {
    try {
      return localStorage.getItem('musiclub_selected_lang');
    } catch (e) {
      return 'es';
    }
  })();

  if (initialSavedLang && initialSavedLang !== 'es') {
    setTimeout(() => {
      triggerReTranslate(initialSavedLang);
    }, 2000);
  }
}
