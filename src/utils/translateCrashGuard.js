// src/utils/translateCrashGuard.js
/**
 * Monkey-patches DOM Node manipulation methods to prevent Google Translate
 * from crashing React with:
 * "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."
 *
 * Coordinates universal 2-second delay for translations on both initial load/refresh
 * and SPA route changes, ensuring all dynamic data loads in Spanish first.
 */

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

/**
 * Protects musical titles, artist names, track names, usernames, and numerical stats
 * from being mangled or translated by Google Translate.
 */
export function protectMusicAndStatsElements() {
  if (typeof document === 'undefined') return;
  try {
    const selector =
      '.music-title, .album-name, .release-name, .release-title, .artist-name, .artist-title, .track-name, .song-title, .title-albumes, .text-albumes, .username-tag, .user-name, .member-name, .critic-name, .author-name, .musiclub-brand, .stat-number, .stat-value, .metric-value, .count-badge, .badge-count, .score-badge, .rating-badge, [data-stat], [data-metric], [data-count], [data-score], [data-badge], [data-album], [data-release], [data-release-name], [data-artist], [data-artist-name], [data-track], [data-user], [data-username], [data-member], [data-notranslate]';

    document.querySelectorAll(selector).forEach((el) => {
      el.setAttribute('translate', 'no');
      el.classList.add('notranslate');
    });

    // Auto-detect and protect any element containing a username tag (e.g. "@username")
    document.querySelectorAll('h4, h3, h2, span, p, strong, div').forEach((el) => {
      if (
        el.children.length === 0 &&
        el.textContent &&
        el.textContent.trim().startsWith('@')
      ) {
        el.setAttribute('translate', 'no');
        el.classList.add('notranslate', 'username-tag');
      }
    });
  } catch (e) {
    // Ignore DOM query issues
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

// Auto-install crash guard immediately on module evaluation
installTranslateCrashGuard();

// Initial page load / refresh coordination:
// Si hay un idioma extranjero guardado, esperar exactamente 2 segundos antes de traducir
if (typeof window !== 'undefined') {
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
