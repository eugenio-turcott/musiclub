'use client';
// Loaded only when the sharing dialog is opened.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  getWeightedReviewScore,
  getTrackDisplayName,
  getEmotionFromReview,
  getReviewFavoriteTrack,
  getReleaseUrl,
} from '../utils/ratingUtils';
import { getMelomanoLevel } from '../utils/badgeSystem';
import { supabaseService } from '../services/supabaseClient';

// =========================================================================
// TEMAS ESTÉTICOS DE DISEÑO STORY 9:16
// =========================================================================
export const THEMES = [
  {
    id: 'neon',
    name: '🌌 Neon',
    fullName: '🌌 Musiclub Neon',
    bgColors: ['#0f0a20', '#0b0d1a', '#05060b'],
    glow1: 'rgba(244, 63, 94, 0.22)',
    glow2: 'rgba(168, 85, 247, 0.18)',
    coverBorder: 'rgba(244, 63, 94, 0.55)',
    accentColor: '#f5576c',
    scorePillGrad: ['#f5576c', '#f093fb'],
    scoreTextColor: '#ffffff',
  },
  {
    id: 'onyx',
    name: '🖤 Onyx',
    fullName: '🖤 Onyx Minimal',
    bgColors: ['#18181b', '#09090b', '#000000'],
    glow1: 'rgba(255, 255, 255, 0.08)',
    glow2: 'rgba(255, 255, 255, 0.04)',
    coverBorder: 'rgba(255, 255, 255, 0.4)',
    accentColor: '#ffffff',
    scorePillGrad: ['#ffffff', '#e4e4e7'],
    scoreTextColor: '#000000',
  },
  {
    id: 'vinyl',
    name: '💿 Retro',
    fullName: '💿 Retro Vinyl',
    bgColors: ['#241407', '#120903', '#060301'],
    glow1: 'rgba(245, 158, 11, 0.25)',
    glow2: 'rgba(217, 119, 6, 0.15)',
    coverBorder: 'rgba(245, 158, 11, 0.55)',
    accentColor: '#f59e0b',
    scorePillGrad: ['#f59e0b', '#fbbf24'],
    scoreTextColor: '#000000',
  },
  {
    id: 'cyber',
    name: '🔮 Cyber',
    fullName: '🔮 Cyber Aura',
    bgColors: ['#04101e', '#071529', '#0d071a'],
    glow1: 'rgba(6, 182, 212, 0.25)',
    glow2: 'rgba(217, 70, 239, 0.2)',
    coverBorder: 'rgba(6, 182, 212, 0.55)',
    accentColor: '#06b6d4',
    scorePillGrad: ['#06b6d4', '#d946ef'],
    scoreTextColor: '#ffffff',
  },
];

// =========================================================================
// LOGOS VECTORIALES OFICIALES SVG
// =========================================================================
import { InstagramIcon, TikTokIcon, WhatsAppIcon, XTwitterIcon, ThreadsIcon, FacebookIcon, TelegramIcon, RedditIcon, SnapchatIcon, SpotifyIcon, ShareIcon, DownloadIcon, CopyImageIcon, LinkIcon } from './common/ShareIcons';

export function getSafeCORSUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (
    url.startsWith('/') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  if (url.includes('wsrv.nl')) {
    return url;
  }
  const isDirectCORSAllowed =
    /i\.scdn\.co|supabase\.co|coverartarchive\.org|archive\.org/i.test(url);
  if (isDirectCORSAllowed) {
    return url;
  }
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&h=800&fit=cover&output=png`;
}

export async function preloadCORSImage(src) {
  if (!src || typeof src !== 'string') return null;
  const targetUrl = getSafeCORSUrl(src);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (targetUrl !== src) {
        const directImg = new Image();
        directImg.onload = () => resolve(directImg);
        directImg.onerror = () => resolve(null);
        directImg.src = src;
      } else {
        const proxied = `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=800&h=800&fit=cover&output=png`;
        const proxyImg = new Image();
        proxyImg.crossOrigin = 'anonymous';
        proxyImg.onload = () => resolve(proxyImg);
        proxyImg.onerror = () => resolve(null);
        proxyImg.src = proxied;
      }
    };
    img.src = targetUrl;
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatReviewDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function formatDisplayScore(score) {
  if (score === null || score === undefined || isNaN(Number(score))) {
    return '10';
  }
  const num = Number(score);
  if (num >= 9.95 || num === 10) {
    return '10';
  }
  return num.toFixed(1);
}

export function getCriticHeaderType(releaseType) {
  if (!releaseType || typeof releaseType !== 'string') return 'CRÍTICA DE ÁLBUM';
  const clean = releaseType.trim().toUpperCase();
  if (clean === 'EP') return 'CRÍTICA DE EP';
  if (clean === 'SINGLE' || clean === 'SENCILLO') return 'CRÍTICA DE SENCILLO';
  if (clean === 'COMPILATION' || clean === 'COMPILACIÓN' || clean === 'COMPILACION') return 'CRÍTICA DE COMPILACIÓN';
  if (clean === 'LIVE' || clean === 'EN VIVO') return 'CRÍTICA DE EN VIVO';
  if (clean === 'SOUNDTRACK' || clean === 'BANDA SONORA' || clean === 'OST') return 'CRÍTICA DE SOUNDTRACK';
  if (clean === 'MIXTAPE') return 'CRÍTICA DE MIXTAPE';
  if (clean === 'DEMO') return 'CRÍTICA DE DEMO';
  if (clean === 'ALBUM' || clean === 'ÁLBUM') return 'CRÍTICA DE ÁLBUM';
  if (clean.startsWith('CRÍTICA DE') || clean.startsWith('CRITICA DE')) return clean;
  return `CRÍTICA DE ${clean}`;
}

// =========================================================================
// GENERADOR NATIVO CANVAS 2D FULL HD 1080x1920 (FORMATO CELULAR 9:16)
// DISEÑO FIJO, CENTRADO Y ULTRA-LIMPIO (SIN AJUSTES NI VINILO 3D)
// =========================================================================
export async function generateReviewStoryCanvas({
  review,
  album: rawAlbum,
  currentUser = null,
  themeId = 'neon',
  reviewerLevelInfo = null,
}) {
  if (
    typeof document !== 'undefined' &&
    document.fonts &&
    document.fonts.ready
  ) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  // Normalizar datos de álbum
  const a = rawAlbum || review?.album || review?.albums || {};
  const album = {
    album_name: a.album_name || a.album || a.name || 'Álbum',
    artist_name: a.artist_name || a.artist || a.artista || 'Artista',
    image_url:
      a.image_url || a.imagen || a.image || review?.album_cover || null,
    release_year: a.release_year || a.releaseYear || null,
    release_type: a.release_type || a.releaseType || 'ÁLBUM',
    tracks: a.tracks || [],
  };

  // Normalizar datos del crítico
  const reviewerName =
    review?.reviewer_name ||
    currentUser?.name ||
    currentUser?.email?.split('@')[0] ||
    'Melómano de Musiclub';
  const reviewerAvatar =
    review?.reviewer_avatar ||
    currentUser?.avatar ||
    currentUser?.avatar_url ||
    currentUser?.user_metadata?.avatar_url ||
    null;

  // Calificación final ponderada (10 en lugar de 10.0 si es perfecta)
  const rawScore = getWeightedReviewScore(review) ?? review?.rating_general;
  const finalScore = formatDisplayScore(rawScore);

  // Sentimiento / Mood
  const emotion = review ? getEmotionFromReview(review) : null;

  // Canción favorita
  let favoriteTrackName = null;
  if (review) {
    const favKey = getReviewFavoriteTrack(review);
    if (favKey) {
      favoriteTrackName = getTrackDisplayName(favKey, album.tracks);
    }
  }

  // Criterios de evaluación (hasta 6, normalizados sin variaciones Unicode \uFE0F)
  const rawCriteria = [
    { icon: '🎛', label: 'PRODUCCIÓN', val: review?.rating_produccion },
    { icon: '🎵', label: 'COMPOSICIÓN', val: review?.rating_composicion },
    { icon: '📝', label: 'LETRAS', val: review?.rating_letras },
    { icon: '💡', label: 'ORIGINALIDAD', val: review?.rating_originalidad },
    { icon: '🔗', label: 'COHESIÓN', val: review?.rating_cohesion },
    { icon: '🔄', label: 'REPLAY', val: review?.rating_replay },
  ];

  const criteria = rawCriteria
    .filter(
      (c) => c.val !== undefined && c.val !== null && !isNaN(Number(c.val))
    )
    .map((c) => ({
      icon: (c.icon || '').replace(/\uFE0F/g, ''),
      label: c.label,
      val: `${Number(c.val).toFixed(0)}/5`,
    }));

  // Canciones destacadas calificadas
  const trMap = review?.track_ratings || review?.trackRatings;
  let topTracksList = [];
  if (trMap && typeof trMap === 'object') {
    topTracksList = Object.entries(trMap)
      .map(([k, score]) => ({
        name: getTrackDisplayName(k, album.tracks),
        score: `★${Number(score).toFixed(score % 1 === 0 ? 0 : 1)}`,
        numScore: Number(score),
      }))
      .filter((t) => !isNaN(t.numScore) && t.numScore > 0)
      .sort((a, b) => b.numScore - a.numScore)
      .slice(0, 3);
  }

  // Precargar imágenes concurrentemente
  const logoImgPromise = preloadCORSImage('/musiclub_logo_corchea.png').then(
    (img) => img || preloadCORSImage('/musiclub_logo_3.png')
  );
  const [logoImg, coverImg, avatarImg] = await Promise.all([
    logoImgPromise,
    preloadCORSImage(album.image_url),
    preloadCORSImage(reviewerAvatar),
  ]);

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  // Crear canvas en 1080 x 1920 (9:16 nativo para Stories)
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // 1. FONDO CON GRADIENTE DEL TEMA
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
  bgGrad.addColorStop(0, theme.bgColors[0]);
  bgGrad.addColorStop(0.45, theme.bgColors[1]);
  bgGrad.addColorStop(1, theme.bgColors[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. RESPLANDORES AMBIENTALES
  const glow1 = ctx.createRadialGradient(920, 240, 50, 920, 240, 600);
  glow1.addColorStop(0, theme.glow1);
  glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, 1080, 1920);

  const glow2 = ctx.createRadialGradient(150, 1550, 50, 150, 1550, 650);
  glow2.addColorStop(0, theme.glow2);
  glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, 1080, 1920);

  // 3. HEADER FIJO EN ZONA SEGURA (y: 116 a 215)
  drawRoundedRect(ctx, 64, 118, 78, 78, 22);
  const logoBoxGrad = ctx.createLinearGradient(64, 118, 142, 196);
  logoBoxGrad.addColorStop(0, '#1f2033');
  logoBoxGrad.addColorStop(1, '#0e0f17');
  ctx.fillStyle = logoBoxGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (logoImg) {
    ctx.drawImage(logoImg, 73, 127, 60, 60);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 40px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M', 103, 172);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '900 38px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Musiclub', 160, 154);

  const criticTypeLabel = getCriticHeaderType(album.release_type);
  ctx.font = '800 18px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = theme.accentColor;
  ctx.fillText(criticTypeLabel, 160, 184);

  // Píldora de fecha (alineada exactamente a la retícula derecha: 1016px)
  const dateStr = formatReviewDate(review?.created_at || review?.review_date);
  if (dateStr) {
    const cleanDate = dateStr.toUpperCase();
    ctx.font = '800 16px "Gabarito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const textW = ctx.measureText(cleanDate).width;
    const pillH = 38;
    const pillPadX = 16;
    const iconW = 14;
    const iconGap = 8;
    const pillW = pillPadX * 2 + iconW + iconGap + textW;
    const dX = 1016 - pillW;
    const pillY = 118 + Math.round((78 - pillH) / 2); // 138px - centrado con la caja del logo (118..196)

    drawRoundedRect(ctx, dX, pillY, pillW, pillH, 19);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Icono vectorial limpio de calendario (evita bugs de emojis y cajas rotas en Canvas)
    const iconX = dX + pillPadX;
    const iconY = pillY + Math.round((pillH - 14) / 2);
    drawRoundedRect(ctx, iconX, iconY, 14, 14, 3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(iconX, iconY + 4);
    ctx.lineTo(iconX + 14, iconY + 4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '800 16px "Gabarito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(cleanDate, iconX + iconW + iconGap, pillY + pillH / 2);
  }

  // Divisor de cabecera
  ctx.beginPath();
  ctx.moveTo(64, 216);
  ctx.lineTo(1080 - 64, 216);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 4. PORTADA DE ÁLBUM (DISEÑO FIJO Y CENTRADO, SIN DISCO DE VINILO)
  const coverSize = 415;
  const coverX = (1080 - coverSize) / 2;
  const coverY = 228;

  // Resplandor ambiental de la carátula
  ctx.save();
  ctx.shadowColor = theme.accentColor;
  ctx.shadowBlur = 40;
  drawRoundedRect(ctx, coverX, coverY, coverSize, coverSize, 26);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();
  ctx.restore();

  // Borde y Carátula
  ctx.save();
  drawRoundedRect(ctx, coverX, coverY, coverSize, coverSize, 26);
  ctx.clip();
  if (coverImg) {
    ctx.drawImage(coverImg, coverX, coverY, coverSize, coverSize);
  } else {
    const placeholderGrad = ctx.createLinearGradient(
      coverX,
      coverY,
      coverX + coverSize,
      coverY + coverSize
    );
    placeholderGrad.addColorStop(0, '#1e1b4b');
    placeholderGrad.addColorStop(1, '#312e81');
    ctx.fillStyle = placeholderGrad;
    ctx.fillRect(coverX, coverY, coverSize, coverSize);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px "Gabarito", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DISCO', coverX + coverSize / 2, coverY + coverSize / 2);
  }
  ctx.restore();

  drawRoundedRect(ctx, coverX, coverY, coverSize, coverSize, 26);
  ctx.strokeStyle = theme.coverBorder;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 5. TÍTULOS DEL LANZAMIENTO (Con espacio generoso y elegante respecto a la carátula)
  const coverBottom = coverY + coverSize; // 228 + 415 = 643
  const titleGap = 36; // 36px de separación limpia para que el título no quede pegado
  let curTitleY = coverBottom + titleGap; // 679

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const rawAlbumTitle = album.album_name || 'Álbum';
  const titleFontSize = rawAlbumTitle.length <= 22 ? 48 : 44;
  ctx.font = `900 ${titleFontSize}px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = '#ffffff';

  let albumTitleLines = wrapText(ctx, rawAlbumTitle, 920);
  if (albumTitleLines.length > 2) {
    albumTitleLines = albumTitleLines.slice(0, 2);
    albumTitleLines[1] = albumTitleLines[1] + '…';
  }

  for (let i = 0; i < albumTitleLines.length; i++) {
    ctx.fillText(albumTitleLines[i], 540, curTitleY);
    curTitleY += titleFontSize + 6;
  }

  const artistTop = curTitleY + 10;
  ctx.font = '700 30px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  let artistToDraw = album.artist_name || 'Artista';
  if (ctx.measureText(artistToDraw).width > 920) {
    while (
      artistToDraw.length > 5 &&
      ctx.measureText(artistToDraw + '…').width > 920
    ) {
      artistToDraw = artistToDraw.slice(0, -1);
    }
    artistToDraw += '…';
  }
  ctx.fillText(artistToDraw, 540, artistTop);

  // Píldora Tipo · Año
  const typeText = [
    album.release_type?.toUpperCase() || 'ÁLBUM',
    album.release_year,
  ]
    .filter(Boolean)
    .join(' · ');
  const typeTop = artistTop + 30 + 16;
  ctx.font = '800 18px "Gabarito", sans-serif';
  const typeW = ctx.measureText(typeText).width + 36;
  drawRoundedRect(ctx, 540 - typeW / 2, typeTop, typeW, 34, 17);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.stroke();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(typeText, 540, typeTop + 17);

  const heroBottom = typeTop + 34;

  // 6. CÁLCULO DE ALTURAS Y DISTRIBUCIÓN VERTICAL ADAPTATIVA
  const startAreaY = heroBottom + 24;
  const endAreaY = 1726;
  const totalAvailable = endAreaY - startAreaY;

  const hasReviewerExtra = !!(emotion || favoriteTrackName);
  const reviewerH = hasReviewerExtra ? 172 : 110;
  const favH = 0; // Integrado directamente en la tarjeta de reviewer para máxima armonía visual

  // Tipografía dinámica de Comentario
  let commentLines = [];
  let commentH = 0;
  let commentFontSize = 34;
  let commentLineHeight = 46;

  if (review?.comment) {
    const trimmedComment = review.comment.trim();
    if (trimmedComment.length > 220) {
      commentFontSize = 29;
      commentLineHeight = 41;
    } else if (trimmedComment.length > 100) {
      commentFontSize = 33;
      commentLineHeight = 45;
    } else {
      commentFontSize = 36;
      commentLineHeight = 50;
    }

    ctx.font = `600 ${commentFontSize}px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif`;
    commentLines = wrapText(ctx, trimmedComment, 810);
    if (commentLines.length > 4) {
      commentLines = commentLines.slice(0, 4);
      commentLines[3] = commentLines[3] + '…';
    }
    commentH = 34 + 28 + commentLines.length * commentLineHeight;
  }

  const criteriaRows = criteria.length > 3 ? 2 : criteria.length > 0 ? 1 : 0;
  const criteriaH =
    criteriaRows > 0
      ? criteriaRows === 2
        ? 92 * 2 + 16
        : 92
      : 0;

  // Pre-calcular distribución de canciones destacadas
  const maxRowWidth = 952 - 56;
  const pillHeight = 48;
  const pillGapX = 14;
  const pillGapY = 12;
  const trackCardPaddingY = 18;
  const trackHeaderH = 36;

  const trackRows = [];
  if (topTracksList.length > 0) {
    let currentRow = [];
    let currentRowW = 0;

    for (let i = 0; i < topTracksList.length; i++) {
      const t = topTracksList[i];
      ctx.font = '800 20px "Gabarito", sans-serif';
      const scoreW = ctx.measureText(' ' + t.score).width;
      const maxAllowedNameW = maxRowWidth - scoreW - 44;

      ctx.font = '700 20px "Gabarito", sans-serif';
      let displayName = t.name;
      if (ctx.measureText(displayName).width > maxAllowedNameW) {
        while (
          displayName.length > 3 &&
          ctx.measureText(displayName + '…').width > maxAllowedNameW
        ) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '…';
      }
      const nameW = ctx.measureText(displayName).width;
      const pillW = nameW + scoreW + 36;

      if (
        currentRow.length > 0 &&
        currentRowW + pillGapX + pillW > maxRowWidth
      ) {
        trackRows.push(currentRow);
        currentRow = [{ ...t, displayName, nameW, scoreW, pillW }];
        currentRowW = pillW;
      } else {
        currentRow.push({ ...t, displayName, nameW, scoreW, pillW });
        currentRowW += (currentRow.length > 1 ? pillGapX : 0) + pillW;
      }
    }
    if (currentRow.length > 0) {
      trackRows.push(currentRow);
    }
  }

  const tracksH =
    trackRows.length > 0
      ? trackCardPaddingY * 2 +
        trackHeaderH +
        trackRows.length * pillHeight +
        (trackRows.length - 1) * pillGapY
      : 0;

  const contentCards = [];
  contentCards.push({ id: 'reviewer', h: reviewerH });
  if (commentH > 0) contentCards.push({ id: 'comment', h: commentH });
  if (criteriaH > 0) contentCards.push({ id: 'criteria', h: criteriaH });
  if (tracksH > 0 && contentCards.length < 4) contentCards.push({ id: 'tracks', h: tracksH });

  let totalCardsH = contentCards.reduce((acc, c) => acc + c.h, 0);
  const cardCount = contentCards.length;

  if (totalCardsH + (cardCount - 1) * 14 > totalAvailable && commentH > 0) {
    commentFontSize = Math.max(26, commentFontSize - 3);
    commentLineHeight = Math.max(36, commentLineHeight - 4);
    ctx.font = `600 ${commentFontSize}px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif`;
    commentLines = wrapText(ctx, (review?.comment || '').trim(), 810);
    if (commentLines.length > 3) {
      commentLines = commentLines.slice(0, 3);
      commentLines[2] = commentLines[2] + '…';
    }
    const newCommentH = 34 + 28 + commentLines.length * commentLineHeight;
    const cObj = contentCards.find((c) => c.id === 'comment');
    if (cObj) cObj.h = newCommentH;
    totalCardsH = contentCards.reduce((acc, c) => acc + c.h, 0);
  }

  const availableForGaps = totalAvailable - totalCardsH;
  const idealGap = Math.max(
    14,
    Math.min(26, availableForGaps / (cardCount + 1))
  );
  const totalGapsH = idealGap * Math.max(1, cardCount - 1);
  const topPadding = Math.max(
    0,
    (totalAvailable - (totalCardsH + totalGapsH)) / 2
  );

  let curY = startAreaY + topPadding;

  // 7. RENDERIZADO DE LAS TARJETAS DINÁMICAS
  for (const card of contentCards) {
    if (card.id === 'reviewer') {
      drawRoundedRect(ctx, 64, curY, 952, reviewerH, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.arc(126, curY + 56, 38, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.clip();

      if (avatarImg) {
        ctx.drawImage(avatarImg, 126 - 38, curY + 56 - 38, 76, 76);
      } else {
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(126 - 38, curY + 56 - 38, 76, 76);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px "Gabarito", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((reviewerName[0] || 'M').toUpperCase(), 126, curY + 68);
      }
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.font = '800 34px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#ffffff';
      let rNameToDraw = reviewerName;
      if (ctx.measureText(rNameToDraw).width > 440) {
        while (
          rNameToDraw.length > 5 &&
          ctx.measureText(rNameToDraw + '…').width > 440
        ) {
          rNameToDraw = rNameToDraw.slice(0, -1);
        }
        rNameToDraw += '…';
      }
      ctx.fillText(rNameToDraw, 184, curY + 52);

      // Subtítulo con Nivel de Melómano y XP (de Estadísticas Detalladas)
      let levelDisplay = reviewerLevelInfo?.text;
      if (!levelDisplay) {
        if (currentUser?.total_xp) {
          const lvl = getMelomanoLevel(currentUser.total_xp);
          levelDisplay = `${lvl.title} · ${currentUser.total_xp.toLocaleString()} XP`;
        } else if (
          (reviewerName || '').toLowerCase().includes('eugenio') ||
          (currentUser?.name || '').toLowerCase().includes('eugenio')
        ) {
          levelDisplay = '🪐 Enciclopedia Sonora';
        } else {
          levelDisplay = 'Crítico de Musiclub';
        }
      }
      ctx.font = '700 20px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = theme.accentColor || '#f43f5e';
      let levelToDraw = levelDisplay;
      if (ctx.measureText(levelToDraw).width > 440) {
        while (
          levelToDraw.length > 5 &&
          ctx.measureText(levelToDraw + '…').width > 440
        ) {
          levelToDraw = levelToDraw.slice(0, -1);
        }
        levelToDraw += '…';
      }
      ctx.fillText(levelToDraw, 184, curY + 84);

      const pillW = 210;
      const pillH = 68;
      const pillX = 1016 - pillW - 20;
      const pillY = curY + 22;
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 20);
      const scoreGrad = ctx.createLinearGradient(
        pillX,
        pillY,
        pillX + pillW,
        pillY + pillH
      );
      scoreGrad.addColorStop(0, theme.scorePillGrad[0]);
      scoreGrad.addColorStop(1, theme.scorePillGrad[1]);
      ctx.fillStyle = scoreGrad;
      ctx.fill();

      // Calificación centrada matemática y verticalmente en su contenedor
      ctx.fillStyle = theme.scoreTextColor;
      ctx.font = '900 36px "Gabarito", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`★ ${finalScore} /10`, pillX + pillW / 2, pillY + pillH / 2);

      // Fila inferior de impresiones del crítico (Emoción y/o Canción Favorita)
      if (hasReviewerExtra) {
        ctx.beginPath();
        ctx.moveTo(88, curY + 112);
        ctx.lineTo(1016 - 24, curY + 112);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.stroke();

        ctx.textBaseline = 'middle';
        const rowCenterY = curY + 142;

        if (emotion && favoriteTrackName) {
          // Emoción a la izquierda
          ctx.textAlign = 'left';
          ctx.font = '800 24px "Gabarito", sans-serif';
          ctx.fillStyle = '#ffffff';
          let emoText = `${emotion.emoji || '🎵'} ${emotion.label}`;
          if (ctx.measureText(emoText).width > 420) {
            emoText = emoText.slice(0, 24) + '…';
          }
          ctx.fillText(emoText, 92, rowCenterY);

          // Canción favorita a la derecha integrada armónicamente
          ctx.textAlign = 'right';
          ctx.font = '700 22px "Gabarito", sans-serif';
          ctx.fillStyle = '#fef08a';
          let favText = `⭐ ${favoriteTrackName}`;
          if (ctx.measureText(favText).width > 420) {
            while (
              favText.length > 5 &&
              ctx.measureText(favText + '…').width > 420
            ) {
              favText = favText.slice(0, -1);
            }
            favText += '…';
          }
          ctx.fillText(favText, 1016 - 28, rowCenterY);
        } else if (emotion) {
          // Solo emoción
          ctx.textAlign = 'left';
          ctx.font = '800 25px "Gabarito", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(
            `${emotion.emoji || '🎵'} ${emotion.label}`,
            92,
            rowCenterY
          );

          if (emotion.desc) {
            ctx.textAlign = 'right';
            ctx.font = '600 21px "Gabarito", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
            let descToDraw = emotion.desc;
            if (ctx.measureText(descToDraw).width > 460) {
              while (
                descToDraw.length > 5 &&
                ctx.measureText(descToDraw + '…').width > 460
              ) {
                descToDraw = descToDraw.slice(0, -1);
              }
              descToDraw += '…';
            }
            ctx.fillText(descToDraw, 1016 - 28, rowCenterY);
          }
        } else if (favoriteTrackName) {
          // Solo canción favorita
          ctx.textAlign = 'left';
          ctx.font = '800 22px "Gabarito", sans-serif';
          ctx.fillStyle = '#f59e0b';
          ctx.fillText('⭐ CANCIÓN FAVORITA:', 92, rowCenterY);
          const lblW = ctx.measureText('⭐ CANCIÓN FAVORITA:').width;

          ctx.font = '700 24px "Gabarito", sans-serif';
          ctx.fillStyle = '#fef08a';
          let favToDraw = favoriteTrackName;
          const maxFavW = 1016 - 28 - (92 + lblW + 12);
          if (ctx.measureText(favToDraw).width > maxFavW) {
            while (
              favToDraw.length > 5 &&
              ctx.measureText(favToDraw + '…').width > maxFavW
            ) {
              favToDraw = favToDraw.slice(0, -1);
            }
            favToDraw += '…';
          }
          ctx.fillText(favToDraw, 92 + lblW + 12, rowCenterY);
        }
      }

      curY += card.h + idealGap;
    } else if (card.id === 'comment') {
      drawRoundedRect(ctx, 64, curY, 952, card.h, 22);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '900 48px "Gabarito", sans-serif';
      ctx.fillStyle = theme.accentColor;
      ctx.fillText('“', 88, curY + 54);

      ctx.font = `600 ${commentFontSize}px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      for (let i = 0; i < commentLines.length; i++) {
        ctx.fillText(commentLines[i], 126, curY + 50 + i * commentLineHeight);
      }

      curY += card.h + idealGap;
    } else if (card.id === 'criteria') {
      const boxW = 304;
      const boxH = 92;
      const gapX = 20;
      const gapY = 16;

      for (let idx = 0; idx < criteria.length; idx++) {
        const c = criteria[idx];
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const bx = 64 + col * (boxW + gapX);
        const by = curY + row * (boxH + gapY);

        drawRoundedRect(ctx, bx, by, boxW, boxH, 18);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 18px "Gabarito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.fillText(`${c.icon} ${c.label}`, bx + boxW / 2, by + 30);

        ctx.font = '900 32px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(c.val, bx + boxW / 2, by + 66);
      }

      curY += card.h + idealGap;
    } else if (card.id === 'tracks') {
      drawRoundedRect(ctx, 64, curY, 952, card.h, 22);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '800 20px "Gabarito", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText('🎵 TRACKS DESTACADOS:', 88, curY + 36);

      let pillRowY = curY + trackCardPaddingY + trackHeaderH;
      for (let r = 0; r < trackRows.length; r++) {
        const row = trackRows[r];
        let pillX = 88;
        for (let c = 0; c < row.length; c++) {
          const item = row[c];
          drawRoundedRect(ctx, pillX, pillRowY, item.pillW, pillHeight, 14);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.font = '700 20px "Gabarito", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.displayName, pillX + 18, pillRowY + 31);

          ctx.font = '800 20px "Gabarito", sans-serif';
          ctx.fillStyle = '#fde047';
          ctx.fillText(item.score, pillX + 18 + item.nameW + 6, pillRowY + 31);

          pillX += item.pillW + pillGapX;
        }
        pillRowY += pillHeight + pillGapY;
      }

      curY += card.h + idealGap;
    }
  }

  // 8. FOOTER FIJO EN ZONA SEGURA (y: 1735 a 1810)
  ctx.beginPath();
  ctx.moveTo(64, 1735);
  ctx.lineTo(1080 - 64, 1735);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (logoImg) {
    ctx.drawImage(logoImg, 64, 1748, 48, 48);
  } else {
    drawRoundedRect(ctx, 64, 1748, 48, 48, 14);
    ctx.fillStyle = '#f5576c';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 26px "Gabarito", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 88, 1772);
  }

  const brandX = 126;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '900 28px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('musiclub.org', brandX, 1772);

  const brandW = ctx.measureText('musiclub.org').width;
  const sepX = brandX + brandW + 18;

  ctx.font = '300 24px "Gabarito", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText('|', sepX, 1772);

  const sepW = ctx.measureText('|').width;
  const taglineX = sepX + sepW + 18;

  ctx.font = '600 22px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText('Comunidad de Crítica Musical', taglineX, 1772);

  const tagText = '#Musiclub';
  ctx.font = '800 22px "Gabarito", sans-serif';
  const tagW = ctx.measureText(tagText).width + 42;
  const tagX = 1080 - 64 - tagW;
  drawRoundedRect(ctx, tagX, 1748, tagW, 48, 24);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tagText, tagX + tagW / 2, 1772);

  return canvas;
}

// =========================================================================
// COMPONENTE PRINCIPAL: SHARE REVIEW MODAL
// DISEÑO FIJO, MODERNO, RESPONSIVO 100% PARA CUALQUIER TAMAÑO DE CELULAR
// =========================================================================
export function ShareReviewModal({
  isOpen,
  onClose,
  review,
  album: rawAlbum,
  currentUser = null,
}) {
  const [selectedThemeId, setSelectedThemeId] = useState('neon');
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Normalizar datos del álbum
  const album = useMemo(() => {
    if (!rawAlbum && !review) return null;
    const a = rawAlbum || review?.album || review?.albums || {};
    return {
      id: a.id || review?.album_id,
      album_name: a.album_name || a.album || a.name || 'Álbum',
      artist_name: a.artist_name || a.artist || a.artista || 'Artista',
      image_url:
        a.image_url || a.imagen || a.image || review?.album_cover || null,
      release_year: a.release_year || a.releaseYear || null,
      release_type: a.release_type || a.releaseType || 'ÁLBUM',
      tracks: a.tracks || [],
    };
  }, [rawAlbum, review]);

  // Calificación final (10 en lugar de 10.0 si es perfecta)
  const finalScore = useMemo(() => {
    if (!review) return '10';
    const s = getWeightedReviewScore(review) ?? review.rating_general;
    return formatDisplayScore(s);
  }, [review]);

  // Sentimiento / Emoción
  const emotion = useMemo(() => {
    return review ? getEmotionFromReview(review) : null;
  }, [review]);

  // Canción favorita
  const favoriteTrackName = useMemo(() => {
    if (!review) return null;
    const favKey = getReviewFavoriteTrack(review);
    if (!favKey) return null;
    return getTrackDisplayName(favKey, album?.tracks);
  }, [review, album]);

  // URL del álbum
  const albumUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://www.musiclub.org';
    const relUrl = album
      ? getReleaseUrl(album)
      : '/';
    return `${origin}${relUrl}`;
  }, [album]);

  // Notificación toast
  const showToast = useCallback((msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  }, []);

  // Estado para nivel y XP del usuario (obtenido de su perfil / Estadísticas Detalladas)
  const [reviewerLevelInfo, setReviewerLevelInfo] = useState(() => {
    if (currentUser?.total_xp) {
      const lvl = getMelomanoLevel(currentUser.total_xp);
      return {
        title: lvl.title,
        xp: currentUser.total_xp,
        text: `${lvl.title} · ${currentUser.total_xp.toLocaleString()} XP`,
      };
    }
    const name = (review?.reviewer_name || currentUser?.name || '').toLowerCase();
    if (name.includes('eugenio')) {
      return {
        title: '🪐 Enciclopedia Sonora',
        xp: null,
        text: '🪐 Enciclopedia Sonora',
      };
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchGamification() {
      try {
        const leaderboard = await supabaseService.getDetailedLeaderboard();
        if (!isMounted || !Array.isArray(leaderboard) || leaderboard.length === 0) return;

        const targetName = (review?.reviewer_name || currentUser?.name || '').toLowerCase().trim();
        const targetEmail = (currentUser?.email || review?.user?.email || '').toLowerCase().trim();
        const targetId = currentUser?.id || review?.user_id;

        const matched = leaderboard.find((u) => {
          const uId = u.id ? String(u.id) : '';
          const uEmail = (u.email || '').toLowerCase().trim();
          const uName = (u.name || '').toLowerCase().trim();
          return (
            (targetId && uId === String(targetId)) ||
            (targetEmail && uEmail === targetEmail) ||
            (targetName && uName === targetName)
          );
        });

        if (matched && isMounted) {
          const xp = matched.total_xp || 0;
          const lvl = getMelomanoLevel(xp);
          setReviewerLevelInfo({
            title: lvl.title,
            xp: xp,
            text: `${lvl.title} · ${xp.toLocaleString()} XP`,
          });
        }
      } catch (e) {
        console.warn('Error fetching reviewer gamification level:', e);
      }
    }

    if (isOpen) {
      fetchGamification();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, review, currentUser]);

  // Generar vista previa con Canvas 2D
  useEffect(() => {
    if (!isOpen || !album) return;
    let cancelled = false;

    const renderPreview = async () => {
      try {
        const canvas = await generateReviewStoryCanvas({
          review,
          album: rawAlbum,
          currentUser,
          themeId: selectedThemeId,
          reviewerLevelInfo,
        });
        if (!cancelled && canvas) {
          setPreviewDataUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Error generando vista previa de Story:', err);
      }
    };

    renderPreview();

    return () => {
      cancelled = true;
    };
  }, [isOpen, review, rawAlbum, currentUser, selectedThemeId, album, reviewerLevelInfo]);

  // Descargar imagen HD (PNG 9:16)
  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true);
      showToast('📸 Generando Story HD en 1080x1920...', 2000);

      const canvas = await generateReviewStoryCanvas({
        review,
        album: rawAlbum,
        currentUser,
        themeId: selectedThemeId,
        reviewerLevelInfo,
      });
      const dataUrl = canvas.toDataURL('image/png');

      const cleanArtist = (album?.artist_name || 'artista')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const cleanAlbum = (album?.album_name || 'album')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const filename = `musiclub-review-${cleanArtist}-${cleanAlbum}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      showToast('✅ ¡Story descargada en tu dispositivo!');
    } catch (err) {
      console.error('Error generando imagen:', err);
      showToast('⚠️ No se pudo generar la imagen.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar imagen al portapapeles
  const handleCopyImage = async () => {
    try {
      setIsGenerating(true);
      showToast('📋 Copiando imagen...', 2000);

      const canvas = await generateReviewStoryCanvas({
        review,
        album: rawAlbum,
        currentUser,
        themeId: selectedThemeId,
        reviewerLevelInfo,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Blob nulo al exportar canvas');
        }
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            showToast('✅ ¡Imagen copiada al portapapeles!');
          } else {
            handleDownloadImage();
          }
        } catch (clipErr) {
          console.warn('Clipboard write falló, descargando en su lugar:', clipErr);
          handleDownloadImage();
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error al copiar imagen:', err);
      showToast('⚠️ No se pudo copiar. Descargando imagen...');
      handleDownloadImage();
    }
  };

  // Web Share API nativa de teléfonos
  const handleNativeShare = async () => {
    const shareText = `🎵 Mi reseña de "${album?.album_name}" de ${album?.artist_name} en Musiclub:\n⭐ Calificación: ${finalScore}/10 ${emotion ? `(${emotion.label})` : ''}\n${favoriteTrackName ? `🎧 Canción Favorita: ${favoriteTrackName}\n` : ''}Lee la reseña completa aquí: ${albumUrl}`;

    try {
      setIsGenerating(true);

      if (navigator.share) {
        try {
          const canvas = await generateReviewStoryCanvas({
            review,
            album: rawAlbum,
            currentUser,
            themeId: selectedThemeId,
            reviewerLevelInfo,
          });
          const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
          if (blob && navigator.canShare) {
            const cleanArtist = (album?.artist_name || 'artista').replace(
              /[^a-z0-9]/gi,
              '_'
            );
            const file = new File(
              [blob],
              `musiclub_review_${cleanArtist}.png`,
              { type: 'image/png' }
            );

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `Review de ${album?.album_name} en Musiclub`,
                text: shareText,
                files: [file],
              });
              showToast('✅ ¡Compartido exitosamente!');
              setIsGenerating(false);
              return;
            }
          }
        } catch (fileShareErr) {
          console.warn('Compartir archivo omitido, usando fallback:', fileShareErr);
        }

        await navigator.share({
          title: `Review de ${album?.album_name} en Musiclub`,
          text: shareText,
          url: albumUrl,
        });
        showToast('✅ ¡Compartido exitosamente!');
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${albumUrl}`);
        handleDownloadImage();
        showToast('📋 Link copiado e imagen descargada.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error en Web Share:', err);
        showToast('⚠️ No se pudo compartir directamente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Texto adaptado para cada red social
  const buildSocialCaption = (platform) => {
    const albumTitle = album?.album_name || 'Álbum';
    const artist = album?.artist_name || 'Artista';
    const stars = `⭐ Calificación: ${finalScore}/10`;
    const moodStr = emotion ? `\nMood: ${emotion.emoji} ${emotion.label}` : '';
    const favStr = favoriteTrackName
      ? `\n🎧 Canción Favorita: ${favoriteTrackName}`
      : '';
    const quoteStr = review?.comment
      ? `\n💬 "${review.comment.slice(0, 120)}${review.comment.length > 120 ? '...' : ''}"`
      : '';

    if (platform === 'whatsapp') {
      return `🎵 *¡Acabo de calificar este disco en Musiclub!* 🎧\n\n💿 *${albumTitle}* — _${artist}_\n${stars} ${moodStr}${favStr}${quoteStr}\n\n👉 Checa mi review completa en el club:\n${albumUrl}`;
    }

    if (platform === 'twitter') {
      return `Acabo de calificar "${albumTitle}" de ${artist} en Musiclub 🎵\n\n${stars} ${moodStr}${favStr}\n\nLee mi review completa aquí:`;
    }

    if (platform === 'threads') {
      return `Acabo de reseñar "${albumTitle}" de ${artist} en Musiclub 🎧\n\n${stars} ${moodStr}${favStr}${quoteStr}\n\n¿Ya lo escuchaste? Mira mi reseña completa: ${albumUrl}`;
    }

    if (platform === 'tiktok') {
      return `Mi review de "${albumTitle}" de ${artist} 🎵 Calificación: ${finalScore}/10 ${moodStr} #Musiclub #AlbumReview #Musica #Review`;
    }

    if (platform === 'instagram') {
      return `Mi review de "${albumTitle}" de ${artist} en Musiclub ✨\n${stars} ${moodStr}${favStr}${quoteStr}\n\n🔗 ${albumUrl}`;
    }

    return `Mi review de "${albumTitle}" de ${artist} en Musiclub: ${stars} ${moodStr} ${albumUrl}`;
  };

  // Acciones por red social
  const handleShareToPlatform = async (platformId) => {
    const caption = buildSocialCaption(platformId);

    switch (platformId) {
      case 'instagram': {
        await handleDownloadImage();
        try {
          await navigator.clipboard.writeText(caption);
        } catch (_) {}
        showToast('📸 Story descargada y texto copiado para Instagram.');
        break;
      }

      case 'tiktok': {
        await handleDownloadImage();
        try {
          await navigator.clipboard.writeText(caption);
        } catch (_) {}
        showToast('🎵 Story descargada y hashtags copiados para TikTok.');
        break;
      }

      case 'whatsapp': {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        break;
      }

      case 'twitter': {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(albumUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        break;
      }

      case 'threads': {
        const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(caption)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        break;
      }

      case 'facebook': {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(albumUrl)}&quote=${encodeURIComponent(caption)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        break;
      }

      case 'telegram': {
        const url = `https://t.me/share/url?url=${encodeURIComponent(albumUrl)}&text=${encodeURIComponent(caption)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        break;
      }

      case 'reddit': {
        const title = `Mi reseña de "${album?.album_name}" (${album?.artist_name}) - Calificación: ${finalScore}/10`;
        const url = `https://www.reddit.com/submit?url=${encodeURIComponent(albumUrl)}&title=${encodeURIComponent(title)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        break;
      }

      case 'snapchat': {
        await handleDownloadImage();
        showToast('👻 Story 9:16 descargada para Snapchat.');
        break;
      }

      default:
        break;
    }
  };

  // Copiar enlace directo
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(albumUrl);
      showToast('🔗 ¡Enlace del álbum copiado!');
    } catch (_) {
      showToast('⚠️ No se pudo copiar el enlace.');
    }
  };

  // Escuchar tecla Escape y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !album) return null;
  if (typeof document === 'undefined') return null;

  const socialPlatforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      bgClass: 'bg-linear-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white',
      borderClass: 'border-pink-500/30',
      icon: <InstagramIcon className="w-4 h-4 text-white" />,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      bgClass: 'bg-[#25D366] text-white',
      borderClass: 'border-emerald-500/30',
      icon: <WhatsAppIcon className="w-4 h-4 text-white" />,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      bgClass: 'bg-black text-white border border-white/20',
      borderClass: 'border-white/20',
      icon: <TikTokIcon className="w-4 h-4 text-white" />,
    },
    {
      id: 'threads',
      name: 'Threads',
      bgClass: 'bg-black text-white border border-white/20',
      borderClass: 'border-white/20',
      icon: <ThreadsIcon className="w-4 h-4 text-white" />,
    },
    {
      id: 'twitter',
      name: 'X',
      bgClass: 'bg-black text-white border border-white/20',
      borderClass: 'border-white/20',
      icon: <XTwitterIcon className="w-3.5 h-3.5 text-white" />,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      bgClass: 'bg-[#1877F2] text-white',
      borderClass: 'border-blue-500/30',
      icon: <FacebookIcon className="w-4 h-4 text-white" />,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      bgClass: 'bg-[#229ED9] text-white',
      borderClass: 'border-sky-500/30',
      icon: <TelegramIcon className="w-4 h-4 text-white" />,
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      bgClass: 'bg-[#FFFC00] text-black',
      borderClass: 'border-yellow-400/30',
      icon: <SnapchatIcon className="w-4 h-4 text-black" />,
    },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl p-0 sm:p-3 overflow-hidden select-none animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Contenedor Modal Ultra-Responsivo Móvil y Fijo */}
      <div
        className="relative w-full h-[100dvh] sm:h-[94dvh] sm:max-h-[860px] sm:max-w-[430px] bg-[#0b0c16] sm:border sm:border-white/15 sm:rounded-[32px] flex flex-col shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Flotante */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-linear-to-r from-pink-500 to-purple-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-2xl border border-white/30 animate-fadeIn whitespace-nowrap text-center pointer-events-none">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Fijo y Limpio */}
        <div className="shrink-0 flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5 min-w-0">
            {album.image_url ? (
              <img
                src={album.image_url}
                alt={album.album_name}
                className="w-9 h-9 rounded-xl object-cover border border-white/20 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <ShareIcon className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-white font-black text-xs sm:text-sm truncate">
                  Compartir Review
                </h3>
                <span className="px-1.5 py-0.5 rounded-md bg-linear-to-r from-pink-500/20 to-purple-500/20 text-pink-300 text-[10px] font-black border border-pink-500/30 shrink-0">
                  ★ {finalScore}
                </span>
              </div>
              <p className="text-white/50 text-[11px] truncate leading-tight">
                {album.album_name} · {album.artist_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Cerrar"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* 2. Área Central: Vista Previa Adaptativa al 100% del espacio */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 relative overflow-hidden">
          {/* Contenedor de la Imagen Story que escala perfectamente a cualquier alto/ancho de celular */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Story Preview"
                className="max-h-full max-w-full aspect-[9/16] object-contain rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] border border-white/20 select-none pointer-events-none transition-all duration-300"
              />
            ) : (
              <div className="aspect-[9/16] max-h-full w-auto flex flex-col items-center justify-center gap-2.5 text-white/50 bg-black/40 rounded-2xl border border-white/10 p-6 text-center shadow-inner">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-white/70">
                  Generando Story HD...
                </span>
              </div>
            )}
          </div>

          {/* Selector de Temas Estéticos Fijo en Píldoras Táctiles */}
          <div className="shrink-0 flex items-center justify-center gap-1.5 mt-2 py-0.5 w-full">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedThemeId(t.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-black transition-all border cursor-pointer active:scale-95 ${
                  selectedThemeId === t.id
                    ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.45)] scale-105'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Barra de Acciones Fija y Completa (Redes y Descarga) */}
        <div
          className="shrink-0 border-t border-white/10 bg-[#070810]/95 backdrop-blur-md px-3 sm:px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] flex flex-col gap-2"
        >
          {/* Botón Principal: Compartir Nativo a Stories / Apps */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleNativeShare}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-pink-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            title="Compartir directo a través del menú de tu teléfono"
          >
            <ShareIcon className="w-4 h-4 text-white shrink-0" />
            <span>Compartir Story</span>
          </button>

          {/* Fila de Herramientas Directas (Descargar HD, Copiar Imagen, Copiar Link) */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadImage}
              className="py-1.5 sm:py-2 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-95 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Guardar imagen 1080x1920 PNG en tu galería"
            >
              <DownloadIcon className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">Descargar HD</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleCopyImage}
              className="py-1.5 sm:py-2 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-95 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Copiar imagen al portapapeles"
            >
              <CopyImageIcon className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">Copiar</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-1.5 sm:py-2 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-95 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Copiar enlace de la reseña"
            >
              <LinkIcon className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">Enlace</span>
            </button>
          </div>

          {/* Carrusel Deslizable de Redes Sociales Famosas (Ultra-Touch Friendly) */}
          <div className="pt-0.5">
            <div
              className="flex items-center gap-2 overflow-x-auto py-1 px-0.5"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {socialPlatforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleShareToPlatform(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${p.bgClass} ${p.borderClass}`}
                  title={`Compartir en ${p.name}`}
                >
                  <div className="shrink-0">{p.icon}</div>
                  <span className="leading-none">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ShareReviewModal;
