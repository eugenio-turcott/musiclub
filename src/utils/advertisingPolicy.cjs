// Automatic display is enabled only for the reviewed Mexican configuration.
// Unknown locations and other markets keep prior permission until reviewed.
function advertisingMode(country) {
  return String(country || '').toUpperCase() === 'MX' ? 'automatic' : 'consent';
}

function mayLoadAdvertising(choice, mode, privacySignal = false) {
  return !privacySignal && choice !== 'rejected' && mode !== 'pending' &&
    (choice === 'accepted' || mode === 'automatic');
}

function publicAdvertisingPath(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  return ['/', '/catalogo', '/reviews', '/leaderboard', '/portadas', '/generos', '/guias', '/sobre-musiclub', '/faq'].includes(path) ||
    /^\/(albumes|albums|eps|ep|sencillos|singles|single|compilaciones|compilations|remixes|remix|release|lanzamiento|artista|artistas|artist|artists|generos|guias)\/[^/]+$/.test(path);
}

module.exports = {advertisingMode, mayLoadAdvertising, publicAdvertisingPath};
