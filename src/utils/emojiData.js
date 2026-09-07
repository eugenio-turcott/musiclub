// src/utils/emojiData.js

/**
 * Reacciones rápidas base oficiales (Estilo Facebook + Dislike)
 */
export const QUICK_REACTIONS = [
  { emoji: '👍', label: 'Me gusta', keywords: ['like', 'me gusta', 'bien', 'bueno', 'aprobado', 'thumbs up'] },
  { emoji: '👎', label: 'No me gusta', keywords: ['dislike', 'no me gusta', 'mal', 'desaprobado', 'thumbs down'] },
  { emoji: '❤️', label: 'Me encanta', keywords: ['love', 'me encanta', 'corazon', 'amor', 'top'] },
  { emoji: '🥰', label: 'Me importa', keywords: ['care', 'me importa', 'tierno', 'abrazo', 'apoyo'] },
  { emoji: '😂', label: 'Me divierte', keywords: ['haha', 'me divierte', 'risa', 'jaja', 'chistoso', 'divertido'] },
  { emoji: '😮', label: 'Me asombra', keywords: ['wow', 'me asombra', 'sorpresa', 'impacto', 'increible'] },
  { emoji: '😢', label: 'Me entristece', keywords: ['sad', 'me entristece', 'triste', 'pena', 'nostalgia'] },
  { emoji: '😡', label: 'Me enoja', keywords: ['angry', 'me enoja', 'furia', 'enojo', 'bronca'] },
];

/**
 * Mapeo para retrocompatibilidad con las reacciones guardadas como texto
 */
export const LEGACY_REACTION_MAP = {
  // Facebook + Dislike
  like: '👍',
  dislike: '👎',
  love: '❤️',
  care: '🥰',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
  // Presets anteriores
  fire: '🔥',
  heart: '❤️',
  mindblown: '🤯',
  clap: '👏',
  music: '🎶',
  skull: '💀',
};

export const REVERSE_LEGACY_MAP = {
  '👍': 'like',
  '👎': 'dislike',
  '❤️': 'love',
  '🥰': 'care',
  '😂': 'haha',
  '😮': 'wow',
  '😢': 'sad',
  '😡': 'angry',
  '🔥': 'fire',
  '🤯': 'mindblown',
  '👏': 'clap',
  '🎶': 'music',
  '💀': 'skull',
};

/**
 * Normaliza cualquier tipo de reacción a su emoji UTF-8 estándar
 */
export function normalizeReactionEmoji(type) {
  if (!type) return '👍';
  if (LEGACY_REACTION_MAP[type]) return LEGACY_REACTION_MAP[type];
  return type;
}

/**
 * Categorías completas de emojis (estilo WhatsApp) con palabras clave en español e inglés
 */
export const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Caras & Emociones',
    icon: '😀',
    emojis: [
      { e: '😀', k: ['feliz', 'sonrisa', 'happy', 'smile'] },
      { e: '😃', k: ['alegre', 'feliz', 'joy'] },
      { e: '😄', k: ['sonriente', 'risa', 'laugh'] },
      { e: '😁', k: ['dientes', 'risa', 'grin'] },
      { e: '😆', k: ['carcajada', 'lol', 'jaja'] },
      { e: '😅', k: ['sudor', 'alivio', 'nervioso'] },
      { e: '😂', k: ['lagrimas', 'risa', 'llorar de risa', 'rofl', 'crying'] },
      { e: '🤣', k: ['rodar', 'muerto de risa', 'lmao'] },
      { e: '🥲', k: ['sonreir llorando', 'nostalgia', 'emocion'] },
      { e: '🥹', k: ['ojos llorosos', 'conmovido', 'tierno', 'cute'] },
      { e: '😊', k: ['calido', 'contento', 'rubor', 'blush'] },
      { e: '😇', k: ['angel', 'santo', 'inocente'] },
      { e: '🙂', k: ['leve', 'tranquilo', 'ok'] },
      { e: '🙃', k: ['al reves', 'ironia', 'sarcasmo'] },
      { e: '😉', k: ['guino', 'complice', 'wink'] },
      { e: '😌', k: ['paz', 'zen', 'calma', 'relajado'] },
      { e: '😍', k: ['enamorado', 'ojos corazon', 'amor', 'love'] },
      { e: '🥰', k: ['amoroso', 'afecto', 'tierno'] },
      { e: '😘', k: ['beso', 'kiss'] },
      { e: '😋', k: ['rico', 'delicioso', 'yum'] },
      { e: '😛', k: ['lengua', 'broma'] },
      { e: '😜', k: ['loco', 'broma', 'guino'] },
      { e: '🤪', k: ['loquisimo', 'zany', 'fiesta'] },
      { e: '🤨', k: ['duda', 'ceja', 'sospecha'] },
      { e: '🧐', k: ['monoculo', 'analisis', 'critico', 'experto'] },
      { e: '🤓', k: ['nerd', 'sabio', 'detallista', 'geek'] },
      { e: '😎', k: ['cool', 'lentes', 'pro', 'onda'] },
      { e: '🤩', k: ['estrellas', 'deslumbrado', 'fan', 'starstruck'] },
      { e: '🥳', k: ['fiesta', 'celebracion', 'party'] },
      { e: '😏', k: ['picaro', 'smirk'] },
      { e: '😒', k: ['desaprobacion', 'meh'] },
      { e: '😞', k: ['decepcion', 'triste', 'sad'] },
      { e: '😔', k: ['pensativo', 'melancolico'] },
      { e: '😟', k: ['preocupado'] },
      { e: '😕', k: ['confundido'] },
      { e: '🙁', k: ['descontento'] },
      { e: '😣', k: ['frustrado', 'dolor'] },
      { e: '😖', k: ['angustia'] },
      { e: '😫', k: ['cansado', 'harto'] },
      { e: '😩', k: ['desesperado'] },
      { e: '🥺', k: ['por favor', 'suplica', 'mirada'] },
      { e: '😢', k: ['llorando', 'tristeza', 'cry'] },
      { e: '😭', k: ['llanto', 'desconsolado', 'drama'] },
      { e: '😮‍💨', k: ['suspiro', 'alivio'] },
      { e: '😤', k: ['triunfo', 'fuerza', 'orgullo'] },
      { e: '😠', k: ['enojado', 'angry'] },
      { e: '😡', k: ['furia', 'rabia', 'rage'] },
      { e: '🤬', k: ['maldiciones', 'groseria', 'censura'] },
      { e: '🤯', k: ['explosion', 'mente', 'mindblown', 'impacto'] },
      { e: '😳', k: ['sorprendido', 'rojo', 'shock'] },
      { e: '🥵', k: ['calor', 'fuego', 'hot'] },
      { e: '🥶', k: ['frio', 'helado', 'cold'] },
      { e: '😱', k: ['grito', 'miedo', 'panico', 'scream'] },
      { e: '😨', k: ['asustado'] },
      { e: '😰', k: ['ansioso', 'sudor frio'] },
      { e: '😥', k: ['aliviado', 'preocupado'] },
      { e: '😓', k: ['agotado'] },
      { e: '🤗', k: ['abrazo', 'calidez', 'hug'] },
      { e: '🤔', k: ['pensando', 'duda', 'filosofo', 'thinking'] },
      { e: '🫣', k: ['mirar entre dedos', 'cringe', 'timido'] },
      { e: '🤭', k: ['risita', 'secreto'] },
      { e: '🫢', k: ['boca tapada', 'sorpresa'] },
      { e: '🫡', k: ['saludo militar', 'respeto', 'orden'] },
      { e: '🤫', k: ['silencio', 'shh', 'secreto'] },
      { e: '🫠', k: ['derretido', 'melting', 'desvanecer'] },
      { e: '🤥', k: ['pinocho', 'mentira'] },
      { e: '😶', k: ['sin boca', 'mudo'] },
      { e: '😐', k: ['neutral', 'indiferente'] },
      { e: '😑', k: ['inexpresivo'] },
      { e: '😬', k: ['incomodo', 'mueca', 'grimace'] },
      { e: '🫨', k: ['sacudida', 'temblor', 'impacto'] },
      { e: '🙄', k: ['ojos arriba', 'fastidio', 'whatever'] },
      { e: '😯', k: ['sorprendido', 'oh'] },
      { e: '😦', k: ['boca abierta'] },
      { e: '😧', k: ['angustiado'] },
      { e: '😮', k: ['boca abierta', 'asombro'] },
      { e: '😲', k: ['estupefacto', 'asombrado'] },
      { e: '🥱', k: ['bostezo', 'aburrido', 'sueno'] },
      { e: '😴', k: ['durmiendo', 'sleep', 'zzz'] },
      { e: '🤤', k: ['baba', 'antojo'] },
      { e: '😪', k: ['somnoliento'] },
      { e: '😵', k: ['mareado', 'noqueado'] },
      { e: '😵‍💫', k: ['espiral', 'aturdido'] },
      { e: '🤐', k: ['cierre', 'boca cerrada'] },
      { e: '🥴', k: ['ebrio', 'mareado', 'tipsy'] },
      { e: '🤢', k: ['nauseas', 'asco'] },
      { e: '🤮', k: ['vomito', 'disgusto'] },
      { e: '🤧', k: ['estornudo'] },
      { e: '😷', k: ['cubrebocas', 'enfermo'] },
      { e: '🤒', k: ['fiebre'] },
      { e: '🤕', k: ['vendaje', 'herido'] },
      { e: '🤑', k: ['dinero', 'rico', 'money'] },
      { e: '🤠', k: ['vaquero', 'cowboy'] },
      { e: '😈', k: ['diablillo', 'malicioso'] },
      { e: '👿', k: ['demonio', 'furia'] },
      { e: '👹', k: ['ogro'] },
      { e: '👺', k: ['duende'] },
      { e: '🤡', k: ['payaso', 'clown', 'broma'] },
      { e: '💩', k: ['caca', 'poop', 'mierda'] },
      { e: '👻', k: ['fantasma', 'ghost', 'espectro'] },
      { e: '💀', k: ['calavera', 'muerto', 'skull', 'dead'] },
      { e: '☠️', k: ['pirata', 'veneno', 'peligro'] },
      { e: '👽', k: ['alien', 'extraterrestre'] },
      { e: '👾', k: ['monstruo', 'pixel', 'videojuego'] },
      { e: '🤖', k: ['robot'] },
    ],
  },
  {
    id: 'music',
    name: 'Música & Sonido',
    icon: '🎵',
    emojis: [
      { e: '🎵', k: ['nota', 'musica', 'sonido', 'cancion', 'track'] },
      { e: '🎶', k: ['notas', 'melodia', 'vibes', 'temazo', 'flow'] },
      { e: '🎼', k: ['partitura', 'solfeo', 'clasica', 'composicion'] },
      { e: '🎧', k: ['audifonos', 'auriculares', 'escucha', 'headphones', 'sound'] },
      { e: '🎤', k: ['microfono', 'voz', 'canto', 'rap', 'karaoke'] },
      { e: '🎙️', k: ['microfono de estudio', 'podcast', 'grabacion'] },
      { e: '📻', k: ['radio', 'fm', 'vintage'] },
      { e: '🎷', k: ['saxofon', 'jazz', 'viento', 'blues'] },
      { e: '🎸', k: ['guitarra', 'rock', 'electrica', 'acustica', 'solo'] },
      { e: '🎹', k: ['piano', 'teclado', 'sintetizador', 'keys'] },
      { e: '🎺', k: ['trompeta', 'metal', 'fanfarria', 'brass'] },
      { e: '🎻', k: ['violin', 'cuerda', 'orquesta'] },
      { e: '🪕', k: ['banjo', 'country', 'folk'] },
      { e: '🥁', k: ['bateria', 'tambor', 'ritmo', 'drum', 'beat'] },
      { e: '🪘', k: ['conga', 'bongo', 'percusion', 'afro'] },
      { e: '🔊', k: ['volumen', 'alto', 'loud', 'bass', 'bajo'] },
      { e: '🔉', k: ['altavoz', 'sonido'] },
      { e: '🔈', k: ['bajo volumen'] },
      { e: '📼', k: ['cassette', 'cinta', 'retro', 'lofi'] },
      { e: '💿', k: ['disco', 'cd', 'album'] },
      { e: '📀', k: ['dvd', 'vinilo', 'dorado', 'gold'] },
      { e: '🕺', k: ['bailarin', 'baile', 'disco', 'dance'] },
      { e: '💃', k: ['bailarina', 'fiesta', 'ritmo', 'salsa'] },
      { e: '🪩', k: ['bola de disco', 'disco ball', 'fiesta', 'club'] },
      { e: '🎭', k: ['teatro', 'drama', 'arte'] },
      { e: '🎬', k: ['cine', 'claqueta', 'video'] },
      { e: '🎨', k: ['arte', 'pintura', 'creatividad'] },
      { e: '📢', k: ['megafono', 'anuncio'] },
      { e: '📣', k: ['corneta', 'atencion'] },
    ],
  },
  {
    id: 'gestures',
    name: 'Gestos & Manos',
    icon: '👍',
    emojis: [
      { e: '👍', k: ['pulgar arriba', 'like', 'bien', 'aprobado', 'ok'] },
      { e: '👎', k: ['dislike', 'mal', 'desaprobado'] },
      { e: '👊', k: ['puno', 'fist', 'fuerza'] },
      { e: '✊', k: ['puno en alto', 'resistencia', 'poder'] },
      { e: '🤛', k: ['choque', 'puño izquierdo'] },
      { e: '🤜', k: ['choque', 'puño derecho'] },
      { e: '👏', k: ['aplauso', 'clapping', 'bravos', 'respeto'] },
      { e: '🙌', k: ['manos arriba', 'alabanza', 'victoria'] },
      { e: '👐', k: ['manos abiertas'] },
      { e: '🤲', k: ['ofrenda', 'oracion'] },
      { e: '🤝', k: ['apreton', 'trato', 'acuerdo', 'deal'] },
      { e: '🙏', k: ['por favor', 'rezo', 'agradecimiento', 'amen', 'gracias'] },
      { e: '✍️', k: ['escribiendo', 'letra', 'compositor', 'resena'] },
      { e: '💅', k: ['unas', 'diva', 'perfeccion', 'slay'] },
      { e: '🤳', k: ['selfie'] },
      { e: '💪', k: ['musculo', 'fuerza', 'poderoso', 'bicep'] },
      { e: '🦾', k: ['brazo mecanico', 'cyber'] },
      { e: '👈', k: ['apuntar izquierda'] },
      { e: '👉', k: ['apuntar derecha'] },
      { e: '👆', k: ['apuntar arriba'] },
      { e: '👇', k: ['apuntar abajo'] },
      { e: '☝️', k: ['un momento', 'atencion'] },
      { e: '✋', k: ['mano parada', 'alto', 'cinco'] },
      { e: '🤚', k: ['dorso de mano'] },
      { e: '🖐️', k: ['mano abierta'] },
      { e: '🖖', k: ['saludo vulcano', 'spock'] },
      { e: '👋', k: ['saludo', 'hola', 'adios', 'wave'] },
      { e: '🤙', k: ['shaka', 'buena onda', 'llamame'] },
      { e: '🫰', k: ['corazon coreano', 'dedos'] },
      { e: '✌️', k: ['paz', 'victoria', 'dos'] },
      { e: '🤞', k: ['dedos cruzados', 'suerte'] },
      { e: '🤟', k: ['te quiero', 'rock on', 'amor'] },
      { e: '🤘', k: ['metal', 'rock', 'cuernos', 'heavy metal'] },
      { e: '👌', k: ['perfecto', 'ok', 'excelente'] },
    ],
  },
  {
    id: 'hearts',
    name: 'Corazones & Afecto',
    icon: '💖',
    emojis: [
      { e: '❤️', k: ['corazon rojo', 'amor', 'love', 'red heart'] },
      { e: '🧡', k: ['corazon naranja'] },
      { e: '💛', k: ['corazon amarillo'] },
      { e: '💚', k: ['corazon verde'] },
      { e: '💙', k: ['corazon azul'] },
      { e: '💜', k: ['corazon morado', 'violeta'] },
      { e: '🖤', k: ['corazon negro', 'dark'] },
      { e: '🤍', k: ['corazon blanco', 'puro'] },
      { e: '🤎', k: ['corazon cafe'] },
      { e: '💔', k: ['corazon roto', 'desamor', 'heartbreak', 'tristeza'] },
      { e: '❤️‍🔥', k: ['corazon en llamas', 'pasion', 'fuego', 'ardiente'] },
      { e: '❤️‍🩹', k: ['corazon sanando', 'recuperacion'] },
      { e: '❣️', k: ['exclamacion corazon'] },
      { e: '💕', k: ['dos corazones', 'enamorados'] },
      { e: '💞', k: ['corazones girando'] },
      { e: '💓', k: ['latido', 'palpitacion'] },
      { e: '💗', k: ['corazon creciente'] },
      { e: '💖', k: ['brillo corazon', 'sparkles', 'magia'] },
      { e: '💘', k: ['flecha de cupido'] },
      { e: '💝', k: ['regalo con lazo'] },
      { e: '💟', k: ['adorno corazon'] },
      { e: '💌', k: ['carta de amor', 'mensaje'] },
      { e: '💋', k: ['beso de labios'] },
      { e: '🫂', k: ['abrazo personas'] },
    ],
  },
  {
    id: 'symbols',
    name: 'Símbolos & Fuego',
    icon: '🔥',
    emojis: [
      { e: '🔥', k: ['fuego', 'candela', 'flama', 'lit', 'fire', 'brutal', 'top'] },
      { e: '✨', k: ['brillo', 'destellos', 'sparkles', 'estrellitas', 'magia', 'glow'] },
      { e: '🌟', k: ['estrella brillante', 'glowing star'] },
      { e: '⭐', k: ['estrella', 'calificacion', 'star'] },
      { e: '💫', k: ['vertigo', 'destello'] },
      { e: '💥', k: ['colision', 'boom', 'bang', 'impacto'] },
      { e: '💯', k: ['cien', '100', 'perfecto', 'score'] },
      { e: '⚡', k: ['rayo', 'trueno', 'energia', 'electricidad', 'lightning'] },
      { e: '☄️', k: ['cometa', 'meteoro'] },
      { e: '🧨', k: ['dinamita', 'petardo'] },
      { e: '🎯', k: ['diana', 'al blanco', 'precision', 'target'] },
      { e: '🏆', k: ['trofeo', 'campeon', 'primer lugar', 'winner'] },
      { e: '🥇', k: ['medalla de oro', 'primer lugar', 'gold'] },
      { e: '🥈', k: ['medalla de plata', 'segundo lugar'] },
      { e: '🥉', k: ['medalla de bronce', 'tercer lugar'] },
      { e: '👑', k: ['corona', 'rey', 'reina', 'king', 'queen', 'top'] },
      { e: '💎', k: ['diamante', 'joya', 'gema', 'precioso'] },
      { e: '🔮', k: ['bola de cristal', 'futuro', 'magia'] },
      { e: '🧿', k: ['ojo turco', 'proteccion'] },
      { e: '🚀', k: ['cohete', 'despegue', 'a la luna', 'rocket'] },
      { e: '🛸', k: ['ovni', 'alien'] },
      { e: '💣', k: ['bomba', 'bomb'] },
      { e: '🔔', k: ['campana', 'notificacion'] },
      { e: '🚨', k: ['alerta', 'sirena', 'emergencia'] },
      { e: '❓', k: ['pregunta', 'interrogacion'] },
      { e: '❗', k: ['exclamacion', 'alerta'] },
      { e: '‼️', k: ['doble exclamacion'] },
      { e: '💬', k: ['burbuja de dialogo', 'comentario', 'chat'] },
      { e: '💭', k: ['pensamiento'] },
      { e: '🧠', k: ['cerebro', 'inteligencia'] },
      { e: '👀', k: ['ojos', 'mirada', 'atento', 'eyes'] },
    ],
  },
  {
    id: 'celebration',
    name: 'Fiesta & Bebidas',
    icon: '🎉',
    emojis: [
      { e: '🎉', k: ['fiesta', 'confeti', 'celebracion', 'congrats'] },
      { e: '🎊', k: ['bola de confeti'] },
      { e: '🎈', k: ['globo', 'cumpleanos'] },
      { e: '🎁', k: ['regalo', 'sorpresa'] },
      { e: '🍾', k: ['champagne', 'descorche', 'brindis'] },
      { e: '🍷', k: ['vino', 'copa', 'wine'] },
      { e: '🍸', k: ['coctel', 'martini'] },
      { e: '🍹', k: ['trago tropical', 'playa'] },
      { e: '🍺', k: ['cerveza', 'beer', 'chela'] },
      { e: '🍻', k: ['brindis de cerveza', 'salud', 'cheers'] },
      { e: '🥂', k: ['brindis de copas', 'salud'] },
      { e: '🥃', k: ['whisky', 'trago corto'] },
      { e: '☕', k: ['cafe', 'coffee', 'caliente'] },
      { e: '🧋', k: ['boba', 'bubble tea'] },
      { e: '🥤', k: ['refresco', 'soda'] },
      { e: '🍿', k: ['palomitas', 'popcorn', 'cine'] },
      { e: '🍕', k: ['pizza'] },
      { e: '🍔', k: ['hamburguesa', 'burger'] },
      { e: '🍟', k: ['papas fritas'] },
      { e: '🌮', k: ['taco', 'mexicano'] },
      { e: '🍩', k: ['dona', 'donut'] },
      { e: '🍰', k: ['pastel', 'cake'] },
      { e: '🍫', k: ['chocolate'] },
      { e: '🍓', k: ['fresa'] },
      { e: '🥑', k: ['aguacate', 'palta'] },
    ],
  },
];

const LOCAL_RECENT_EMOJIS_KEY = 'musiclub_recent_emojis_v1';

/**
 * Obtiene la lista de emojis recientes guardados localmente
 */
export function getRecentEmojis() {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_RECENT_EMOJIS_KEY);
    if (!raw) return ['👍', '👎', '❤️', '🥰', '😂', '😮', '😢', '😡'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : ['👍', '👎', '❤️', '🥰', '😂', '😮', '😢', '😡'];
  } catch {
    return ['👍', '👎', '❤️', '🥰', '😂', '😮', '😢', '😡'];
  }
}

/**
 * Agrega un emoji al inicio de la lista de recientes
 */
export function addRecentEmoji(emoji) {
  try {
    if (typeof window === 'undefined' || !emoji) return;
    const current = getRecentEmojis().filter((e) => e !== emoji);
    const updated = [emoji, ...current].slice(0, 24);
    localStorage.setItem(LOCAL_RECENT_EMOJIS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Búsqueda de emojis en base a texto (búsqueda en nombres y palabras clave en español e inglés)
 */
export function searchEmojis(query) {
  if (!query || !query.trim()) return [];
  const cleanQ = query.trim().toLowerCase();

  const results = [];
  const seen = new Set();

  EMOJI_CATEGORIES.forEach((cat) => {
    cat.emojis.forEach((item) => {
      if (seen.has(item.e)) return;
      const match =
        item.e === cleanQ ||
        item.k.some((keyword) => keyword.includes(cleanQ));
      if (match) {
        seen.add(item.e);
        results.push(item.e);
      }
    });
  });

  return results;
}
