import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { useAuth } from '../hooks/useAuth';

const AVAILABLE_GENRES = [
  'Rock',
  'Indie',
  'Hip-Hop',
  'Pop',
  'Electrónica',
  'Synthwave',
  'R&B / Soul',
  'Jazz',
  'Metal',
  'Punk',
  'Folk',
  'Reggae',
  'Ambient',
  'Shoegaze',
  'Clásica',
  'Latino / Trap',
];

export function UserSettings() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [favoriteAlbum, setFavoriteAlbum] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [customGenre, setCustomGenre] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const draftKey = user?.id
    ? `musiclub_settings_draft_${user.id}`
    : user?.email
    ? `musiclub_settings_draft_${user.email}`
    : null;

  const isInitializedRef = React.useRef(false);

  // Initialize from draft or from user DB values
  useEffect(() => {
    if (!user) return;
    if (isInitializedRef.current) return;

    let restored = false;
    if (draftKey) {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name !== undefined) setName(parsed.name);
          if (parsed.avatar !== undefined) setAvatar(parsed.avatar);
          if (parsed.bio !== undefined) setBio(parsed.bio);
          if (parsed.favoriteArtist !== undefined) setFavoriteArtist(parsed.favoriteArtist);
          if (parsed.favoriteAlbum !== undefined) setFavoriteAlbum(parsed.favoriteAlbum);
          if (Array.isArray(parsed.selectedGenres)) setSelectedGenres(parsed.selectedGenres);
          if (parsed.spotifyUrl !== undefined) setSpotifyUrl(parsed.spotifyUrl);
          if (parsed.instagramUrl !== undefined) setInstagramUrl(parsed.instagramUrl);
          restored = true;
        }
      } catch (e) {
        console.warn('Error reading settings draft from localStorage', e);
      }
    }

    if (!restored) {
      setName(user.name || '');
      setAvatar(user.avatar || user.avatar_url || '');
      setBio(user.bio || '');
      setFavoriteArtist(user.favorite_artist || '');
      setFavoriteAlbum(user.favorite_album || '');
      setSelectedGenres(Array.isArray(user.favorite_genres) ? user.favorite_genres : []);
      setSpotifyUrl(user.spotify_url || '');
      setInstagramUrl(user.instagram_url || '');
    }

    isInitializedRef.current = true;
  }, [user, draftKey]);

  // Auto-save changes to localStorage
  useEffect(() => {
    if (!draftKey || !isInitializedRef.current || saving) return;

    try {
      const draft = {
        name,
        avatar,
        bio,
        favoriteArtist,
        favoriteAlbum,
        selectedGenres,
        spotifyUrl,
        instagramUrl,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (e) {
      console.warn('Error saving settings draft to localStorage', e);
    }
  }, [
    draftKey,
    name,
    avatar,
    bio,
    favoriteArtist,
    favoriteAlbum,
    selectedGenres,
    spotifyUrl,
    instagramUrl,
    saving,
  ]);

  const handleResetToUser = () => {
    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}
    }
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || user.avatar_url || '');
      setBio(user.bio || '');
      setFavoriteArtist(user.favorite_artist || '');
      setFavoriteAlbum(user.favorite_album || '');
      setSelectedGenres(Array.isArray(user.favorite_genres) ? user.favorite_genres : []);
      setSpotifyUrl(user.spotify_url || '');
      setInstagramUrl(user.instagram_url || '');
    }
    setErrorMessage('');
    setSuccessMessage('Se han restaurado los valores actuales de tu perfil.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleAddCustomGenre = (e) => {
    if (e) e.preventDefault();
    const clean = customGenre.trim();
    if (clean && !selectedGenres.includes(clean)) {
      setSelectedGenres((prev) => [...prev, clean]);
      setCustomGenre('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor introduce tu nombre o alias');
      setSaving(false);
      return;
    }

    const profileData = {
      name: name.trim(),
      avatar: avatar.trim(),
      avatar_url: avatar.trim(),
      bio: bio.trim(),
      favorite_artist: favoriteArtist.trim(),
      favorite_album: favoriteAlbum.trim(),
      favorite_genres: selectedGenres,
      spotify_url: spotifyUrl.trim(),
      instagram_url: instagramUrl.trim(),
    };

    const result = await updateProfile(profileData);
    setSaving(false);

    if (result.success) {
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch (e) {}
      }
      setSuccessMessage('¡Perfil y configuración actualizados con éxito!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } else {
      setErrorMessage(result.error || 'Error al guardar los cambios.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-4 shadow-xl">
          ⚙️
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Configuración del Perfil</h2>
        <p className="text-white/50 text-sm max-w-md mb-6">
          Debes iniciar sesión para editar tu perfil y preferencias personales.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl font-bold shadow-lg shadow-[#f5576c]/20 hover:scale-105 transition-all text-sm"
        >
          Ir al Inicio / Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Universal Standard App Header */}
      <AppHeader showTitle={false} />

      {/* HEADER DE LA SECCIÓN */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#121428] to-[#0a0d18] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex-shrink-0">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Configuración de Perfil
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                  <span>💾</span> Autoguardado
                </span>
              </div>
              <p className="text-white/50 text-xs sm:text-sm mt-0.5">
                Administra tus datos personales, avatar, gustos musicales y enlaces sociales.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Quieres descartar los cambios no guardados y restaurar tu información actual?')) {
                handleResetToUser();
              }
            }}
            className="self-start sm:self-auto text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all font-medium active:scale-95"
            title="Descartar cambios no guardados y restaurar desde la base de datos"
          >
            🔄 Revertir cambios
          </button>
        </div>
      </div>

      {/* FORMULARIO DE EDICIÓN */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: FOTO DE PERFIL / AVATAR */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#101322] to-[#080a14] border border-white/10 shadow-xl space-y-5">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <span>👤</span> Foto de Perfil / Avatar
          </h2>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Preview actual */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-black/50 flex items-center justify-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150/1a1a2e/ffffff?text=👤';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-white font-bold">
                    {(name || 'U')[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                Vista Previa
              </span>
            </div>

            {/* Input de URL de Avatar */}
            <div className="flex-1 space-y-2 w-full">
              <label className="block text-white/70 text-xs font-semibold">
                URL de imagen o foto de perfil:
              </label>
              <input
                type="url"
                placeholder="https://ejemplo.com/tu-foto.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all"
              />
              <p className="text-white/40 text-[11px] leading-relaxed">
                Pega el enlace directo a tu imagen (JPG, PNG, GIF, WebP). Si lo dejas vacío, se usará tu inicial o la foto de tu cuenta.
              </p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: INFORMACIÓN PERSONAL BÁSICA */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#101322] to-[#080a14] border border-white/10 shadow-xl space-y-4">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <span>📝</span> Información Básica
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-xs font-semibold mb-1">
                Nombre / Alias en Musiclub:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre o nick"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-white/70 text-xs font-semibold mb-1">
                Correo Electrónico (Solo Lectura):
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white/40 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-xs font-semibold mb-1">
              Biografía / Presentación Musical:
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale al club sobre tu trasfondo musical, instrumentos que tocas o lo que buscas al escuchar un álbum..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all resize-none"
            />
          </div>
        </div>

        {/* SECCIÓN 3: PREFERENCIAS Y GUSTOS MUSICALES */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#101322] to-[#080a14] border border-white/10 shadow-xl space-y-4">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <span>🎧</span> Gustos e Identidad Musical
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-xs font-semibold mb-1">
                Artista o Banda Favorita:
              </label>
              <input
                type="text"
                value={favoriteArtist}
                onChange={(e) => setFavoriteArtist(e.target.value)}
                placeholder="Ej. Pink Floyd, Radiohead, Kendrick Lamar..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-white/70 text-xs font-semibold mb-1">
                Álbum Favorito de Todos los Tiempos:
              </label>
              <input
                type="text"
                value={favoriteAlbum}
                onChange={(e) => setFavoriteAlbum(e.target.value)}
                placeholder="Ej. The Dark Side of the Moon, OK Computer..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-xs font-semibold mb-2">
              Géneros Musicales Favoritos (Selecciona los que te apasionan):
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {AVAILABLE_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {genre}
                  </button>
                );
              })}
            </div>

            {/* Agregar género personalizado */}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Otro género (ej. Math Rock)..."
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleAddCustomGenre}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: ENLACES SOCIALES Y STREAMING */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#101322] to-[#080a14] border border-white/10 shadow-xl space-y-4">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <span>🔗</span> Enlaces de Redes y Música
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-xs font-semibold mb-1">
                Perfil de Spotify URL:
              </label>
              <input
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/user/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-white/70 text-xs font-semibold mb-1">
                Instagram URL / Perfil:
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/tu_usuario"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* MENSAJES DE ESTADO */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
            <span>✅</span> {successMessage}
          </div>
        )}

        {/* BOTÓN DE GUARDAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Quieres descartar el borrador y volver a los datos originales?')) {
                handleResetToUser();
              }
            }}
            className="w-full sm:w-auto text-xs text-white/40 hover:text-rose-300 transition-colors py-2 px-1 text-center font-medium inline-flex items-center justify-center gap-1"
          >
            <span>🗑️</span> Descartar borrador
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              to="/profile"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs sm:text-sm font-semibold transition-all text-center border border-white/10"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={saving}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 ${
                saving ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Guardando Cambios...
                </>
              ) : (
                <>
                  <span>💾</span> Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
