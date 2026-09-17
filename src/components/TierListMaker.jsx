// src/components/TierListMaker.jsx
import React, { useState, useMemo } from 'react';
import { getWeightedReviewScore } from '../utils/ratingUtils';
import { ShareIcon } from './ShareReviewModal';
import ShareTierListModal from './ShareTierListModal';
import { getMelomanoLevel } from '../utils/badgeSystem';

// SVG local data URIs que nunca fallan por red ni por CORS
export const PLACEHOLDER_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23121424'/%3E%3Ccircle cx='150' cy='150' r='100' fill='%231e2238' stroke='%23333852' stroke-width='4'/%3E%3Ccircle cx='150' cy='150' r='40' fill='%23f5576c' opacity='0.85'/%3E%3Ccircle cx='150' cy='150' r='12' fill='%23121424'/%3E%3Ctext x='150' y='275' font-family='sans-serif' font-size='16' font-weight='bold' fill='%236b7280' text-anchor='middle'%3EMUSICLUB%3C/text%3E%3C/svg%3E";

export const DEFAULT_TIERS = [
  {
    id: 'S',
    label: 'S',
    name: 'Excelentes',
    subtitle: '9.5 - 10.0',
    minScore: 9.5,
    maxScore: 10.0,
    hexColor: '#ff4757',
    headerBg: 'bg-[#ff4757]',
    headerText: 'text-white font-black',
    glowColor: 'shadow-[#ff4757]/30',
    rowBg: 'bg-[#ff4757]/[0.05]',
    rowBorder: 'border-[#ff4757]/30',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    mobileHeaderBg:
      'bg-gradient-to-r from-[#ff4757]/30 via-[#ff4757]/15 to-transparent border-[#ff4757]/40',
    mobileBadgeBg: 'bg-[#ff4757] text-white',
    icon: '🔥',
  },
  {
    id: 'A',
    label: 'A',
    name: 'Muy Buenos',
    subtitle: '8.5 - 9.4',
    minScore: 8.5,
    maxScore: 9.4,
    hexColor: '#ff7f50',
    headerBg: 'bg-[#ff7f50]',
    headerText: 'text-white font-black',
    glowColor: 'shadow-[#ff7f50]/30',
    rowBg: 'bg-[#ff7f50]/[0.05]',
    rowBorder: 'border-[#ff7f50]/30',
    tagColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    mobileHeaderBg:
      'bg-gradient-to-r from-[#ff7f50]/30 via-[#ff7f50]/15 to-transparent border-[#ff7f50]/40',
    mobileBadgeBg: 'bg-[#ff7f50] text-white',
    icon: '🌟',
  },
  {
    id: 'B',
    label: 'B',
    name: 'Buenos',
    subtitle: '7.5 - 8.4',
    minScore: 7.5,
    maxScore: 8.4,
    hexColor: '#eccc68',
    headerBg: 'bg-[#eccc68]',
    headerText: 'text-slate-950 font-black',
    glowColor: 'shadow-[#eccc68]/30',
    rowBg: 'bg-[#eccc68]/[0.05]',
    rowBorder: 'border-[#eccc68]/30',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    mobileHeaderBg:
      'bg-gradient-to-r from-[#eccc68]/30 via-[#eccc68]/15 to-transparent border-[#eccc68]/40',
    mobileBadgeBg: 'bg-[#eccc68] text-slate-950 font-black',
    icon: '✨',
  },
  {
    id: 'C',
    label: 'C',
    name: 'Regulares',
    subtitle: '6.5 - 7.4',
    minScore: 6.5,
    maxScore: 7.4,
    hexColor: '#2ed573',
    headerBg: 'bg-[#2ed573]',
    headerText: 'text-slate-950 font-black',
    glowColor: 'shadow-[#2ed573]/30',
    rowBg: 'bg-[#2ed573]/[0.05]',
    rowBorder: 'border-[#2ed573]/30',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    mobileHeaderBg:
      'bg-gradient-to-r from-[#2ed573]/30 via-[#2ed573]/15 to-transparent border-[#2ed573]/40',
    mobileBadgeBg: 'bg-[#2ed573] text-slate-950 font-black',
    icon: '👍',
  },
  {
    id: 'D',
    label: 'D',
    name: 'Malos',
    subtitle: '5.0 - 6.4',
    minScore: 5.0,
    maxScore: 6.4,
    hexColor: '#1e90ff',
    headerBg: 'bg-[#1e90ff]',
    headerText: 'text-white font-black',
    glowColor: 'shadow-[#1e90ff]/30',
    rowBg: 'bg-[#1e90ff]/[0.05]',
    rowBorder: 'border-[#1e90ff]/30',
    tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    mobileHeaderBg:
      'bg-gradient-to-r from-[#1e90ff]/30 via-[#1e90ff]/15 to-transparent border-[#1e90ff]/40',
    mobileBadgeBg: 'bg-[#1e90ff] text-white',
    icon: '⚠️',
  },
  {
    id: 'F',
    label: 'F',
    name: 'Pésimos',
    subtitle: '< 5.0',
    minScore: 0,
    maxScore: 4.9,
    hexColor: '#9b59b6',
    headerBg: 'bg-[#9b59b6]',
    headerText: 'text-white font-black',
    glowColor: 'shadow-[#9b59b6]/30',
    rowBg: 'bg-[#9b59b6]/[0.05]',
    rowBorder: 'border-[#9b59b6]/30',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    mobileHeaderBg:
      'bg-gradient-to-r from-[#9b59b6]/30 via-[#9b59b6]/15 to-transparent border-[#9b59b6]/40',
    mobileBadgeBg: 'bg-[#9b59b6] text-white',
    icon: '💀',
  },
];

/**
 * Redondeo matemático estricto hacia abajo (floor) a 1 decimal.
 * Garantiza que calificaciones como 9.48 o 9.46 NUNCA se eleven a 9.5
 * y respeten escrupulosamente los límites de cada tier.
 */
export function roundDownScore(score) {
  if (score === null || score === undefined || isNaN(score)) return 0;
  const num = Number(score);
  return Math.floor(num * 10 + 1e-6) / 10;
}

// Helper para calcular el Tier automático según los criterios (redondeo siempre hacia abajo)
export function getTierFromScore(score) {
  if (score === null || score === undefined || isNaN(score)) return 'F';
  const s = roundDownScore(score);
  if (s >= 9.5) return 'S';
  if (s >= 8.5) return 'A';
  if (s >= 7.5) return 'B';
  if (s >= 6.5) return 'C';
  if (s >= 5.0) return 'D';
  return 'F';
}

// Carga segura de imágenes con CORS para Canvas sin manchar el contexto
function preloadCORSImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);

    // Si ya es un SVG data URI o local seguro
    if (src.startsWith('data:')) {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
      return;
    }

    // 1. Intentar carga directa con crossOrigin='anonymous'
    const imgDirect = new Image();
    imgDirect.crossOrigin = 'anonymous';
    imgDirect.onload = () => resolve(imgDirect);
    imgDirect.onerror = () => {
      // 2. Si el servidor origen bloquea CORS (Sanborns, Bandcamp), cargar a través de proxy seguro con CORS
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=300&h=300&fit=cover`;
      const imgProxy = new Image();
      imgProxy.crossOrigin = 'anonymous';
      imgProxy.onload = () => resolve(imgProxy);
      imgProxy.onerror = () => {
        // 3. Si ambos fallan, devolvemos null para que el canvas dibuje el estilo vinilo sin manchar el canvas
        resolve(null);
      };
      imgProxy.src = proxyUrl;
    };
    imgDirect.src = src;
  });
}

// Función auxiliar para dibujar rectángulos redondeados en Canvas
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

// Función auxiliar para redondear solo las esquinas izquierdas
function drawRoundedLeftRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generador de canvas 2D nativo para el Tier List de un usuario.
 * Exportado para reutilización directa en TierListMaker y ShareTierListModal.
 */
export async function generateTierListCanvas({
  classifiedItems = [],
  tierGroups = {},
  userName = 'Melómano',
  user = null,
  totalCategorized = 0,
  format = 'mobile', // 'mobile' | 'landscape'
}) {
  // Asegurar que las fuentes web estén completamente cargadas antes de pintar
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('document.fonts.ready error in tier list canvas:', e);
    }
  }

  // 1. Precargar logo de Musiclub y portadas con CORS seguro
  const logoImgPromise = preloadCORSImage('/musiclub_logo_corchea.png').then(
    (img) => img || preloadCORSImage('/musiclub_logo_3.png')
  );

  // Precargar únicamente las portadas que se van a dibujar (máximo 20 releases por tier)
  const itemsToRender = DEFAULT_TIERS.flatMap((tier) =>
    (tierGroups[tier.id] || []).slice(0, 20)
  );

  const albumImagesPromises = itemsToRender.map(async (item) => {
    const img = await preloadCORSImage(item.imagen);
    return { albumId: item.albumId, img };
  });

  const [logoImg, loadedAlbumImages] = await Promise.all([
    logoImgPromise,
    Promise.all(albumImagesPromises),
  ]);

  const imageMap = new Map();
  loadedAlbumImages.forEach(({ albumId, img }) => {
    if (img) imageMap.set(albumId, img);
  });

  // 2. Geometría y dimensiones según el formato elegido
  const isMobile = format === 'mobile';
  const CANVAS_WIDTH = isMobile ? 1080 : 1200;
  const PADDING_X = isMobile ? 32 : 36;
  const HEADER_HEIGHT = isMobile ? 140 : 110;
  const FOOTER_HEIGHT = isMobile ? 80 : 64;
  const ROW_GAP = 14;
  const BADGE_WIDTH = isMobile ? 168 : 150;
  const TRAY_PADDING = 14;
  const TILE_GAP = 12;

  const availableTrayWidth =
    CANVAS_WIDTH - PADDING_X * 2 - BADGE_WIDTH - TRAY_PADDING * 2;

  // En móvil: 5 carátulas por fila de ~154px (grandes, nítidas y legibles en cualquier celular)
  // Al limitar a máximo 20 lanzamientos por tier, 20 / 5 = exactamente 4 filas completas y ordenadas
  // En landscape: 9 carátulas por fila de 90px
  const tilesPerRow = isMobile
    ? 5
    : Math.max(
        1,
        Math.floor((availableTrayWidth + TILE_GAP) / (90 + TILE_GAP))
      );

  const TILE_SIZE = isMobile
    ? Math.floor(
        (availableTrayWidth - (tilesPerRow - 1) * TILE_GAP) / tilesPerRow
      )
    : 90;

  // Calcular altura de cada fila limitando estrictamente a máximo 20 (Top) en cada tier
  const tierLayouts = DEFAULT_TIERS.map((tier) => {
    const rawItems = tierGroups[tier.id] || [];
    // Máximo 20 lanzamientos (Top 20 por calificación) por cada tier
    const items = rawItems.slice(0, 20);
    const totalInTier = rawItems.length;
    const rowsCount = Math.max(1, Math.ceil(items.length / tilesPerRow));
    const minHeight = isMobile ? (items.length === 0 ? 104 : 182) : 104;
    const calculatedHeight =
      items.length === 0
        ? minHeight
        : rowsCount * TILE_SIZE +
          (rowsCount - 1) * TILE_GAP +
          TRAY_PADDING * 2;
    const rowHeight = Math.max(minHeight, calculatedHeight);
    return { tier, items, totalInTier, rowHeight };
  });

  const totalRowsHeight = tierLayouts.reduce(
    (sum, t) => sum + t.rowHeight + ROW_GAP,
    0
  );

  const calculatedCanvasHeight =
    HEADER_HEIGHT + totalRowsHeight + FOOTER_HEIGHT + 24;

  // En móvil: se asegura un mínimo de 1920px (9:16 vertical story)
  // Si hay más álbumes (máximo 20 por tier), la altura crece naturalmente (~2200-2400px),
  // ajustándose perfectamente a la proporción 19.5:9 de pantallas de celular
  const CANVAS_HEIGHT = isMobile
    ? Math.max(1920, calculatedCanvasHeight)
    : calculatedCanvasHeight;

  // Espacio vertical para centrar el contenido si sobra lienzo en pantallas móviles
  const extraVerticalSpace = isMobile
    ? Math.max(0, CANVAS_HEIGHT - calculatedCanvasHeight)
    : 0;
  const verticalOffset = Math.floor(extraVerticalSpace / 2);

  // 3. Crear canvas y contexto 2D (escala x2 para Retina / pantallas móviles)
  const SCALE = 2;
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH * SCALE;
  canvas.height = CANVAS_HEIGHT * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // Fondo general oscuro profundo
  ctx.fillStyle = '#080914';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Brillo radial de fondo con acento neón suave
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    HEADER_HEIGHT + verticalOffset,
    80,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_WIDTH
  );
  gradient.addColorStop(0, '#161936');
  gradient.addColorStop(0.6, '#0c0e1e');
  gradient.addColorStop(1, '#070810');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 4. DIBUJAR ENCABEZADO
  const headerY = (isMobile ? 24 : 28) + verticalOffset;
  const logoSize = isMobile ? 64 : 52;

  if (logoImg) {
    ctx.save();
    ctx.shadowColor = 'rgba(245, 87, 108, 0.45)';
    ctx.shadowBlur = 14;
    ctx.drawImage(logoImg, PADDING_X, headerY, logoSize, logoSize);
    ctx.restore();
  }

  // Título MUSICLUB TIER LIST con tipografía más grande y legible
  const titleX = logoImg ? PADDING_X + logoSize + 16 : PADDING_X;
  ctx.font = isMobile
    ? '900 32px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
    : '900 26px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('MUSICLUB ', titleX, headerY + 4);

  const titleWidth = ctx.measureText('MUSICLUB ').width;
  ctx.fillStyle = '#f5576c';
  ctx.fillText('TIER LIST', titleX + titleWidth, headerY + 4);

  // Subtítulo claro y legible
  ctx.font = isMobile
    ? '600 16px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
    : '500 13px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillText(
    'Colección y ranking oficial de álbumes evaluados',
    titleX,
    headerY + (isMobile ? 40 : 34)
  );

  // Info del usuario a la derecha
  ctx.textAlign = 'right';
  ctx.font = isMobile
    ? '900 24px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
    : '800 18px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#f093fb';
  ctx.fillText(userName, CANVAS_WIDTH - PADDING_X, headerY + 4);

  // Nivel de Melómano o contador
  const countDisplay = totalCategorized || classifiedItems.length;
  const melomanoLevel = user ? getMelomanoLevel(user.total_xp ?? 0) : null;
  const userSubtext = melomanoLevel
    ? `${melomanoLevel.title} · ${countDisplay} ${countDisplay === 1 ? 'disco' : 'discos'}`
    : `${countDisplay} álbumes calificados`;

  ctx.font = isMobile
    ? '700 15px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
    : '600 12px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(userSubtext, CANVAS_WIDTH - PADDING_X, headerY + (isMobile ? 36 : 30));

  ctx.textAlign = 'left';

  // Línea divisoria del header
  const dividerY = headerY + (isMobile ? 74 : 68);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, dividerY);
  ctx.lineTo(CANVAS_WIDTH - PADDING_X, dividerY);
  ctx.stroke();

  // 5. DIBUJAR FILAS DE TIERS
  let currentY = HEADER_HEIGHT + verticalOffset + 10;

  for (const { tier, items, totalInTier, rowHeight } of tierLayouts) {
    const rowX = PADDING_X;
    const rowWidth = CANVAS_WIDTH - PADDING_X * 2;

    // Fondo y borde de toda la fila
    drawRoundedRect(ctx, rowX, currentY, rowWidth, rowHeight, 14);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Insignia / Cabecera Lateral del Tier (Izquierda)
    drawRoundedLeftRect(ctx, rowX, currentY, BADGE_WIDTH, rowHeight, 14);
    ctx.fillStyle = tier.hexColor;
    ctx.fill();

    // Contenido del Badge Centrado Verticalmente en el Tier
    const isDarkText = tier.id === 'B' || tier.id === 'C';
    const badgeTextColor = isDarkText ? '#090d16' : '#ffffff';
    const badgeCenterX = rowX + BADGE_WIDTH / 2;
    const badgeCenterY = currentY + rowHeight / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = badgeTextColor;

    if (items.length === 0) {
      // Tier vacío: presentación compacta
      ctx.font = '900 42px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(tier.label, badgeCenterX, badgeCenterY - 20);

      ctx.font = '900 12px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(tier.name.toUpperCase(), badgeCenterX, badgeCenterY + 12);

      ctx.font = '800 11.5px monospace, sans-serif';
      ctx.fillText(tier.subtitle, badgeCenterX, badgeCenterY + 30);
    } else {
      // Letra del Tier (S, A, B, C, D, F) con tamaño grande
      ctx.font = isMobile
        ? '900 58px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
        : '900 40px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(tier.label, badgeCenterX, badgeCenterY - 42);

      // Nombre del Tier (OBRAS MAESTRAS, EXCELENTES, etc.)
      ctx.font = isMobile
        ? '900 14px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
        : '900 11px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(tier.name.toUpperCase(), badgeCenterX, badgeCenterY - 2);

      // Rango de puntuación (Pill)
      const pillWidth = isMobile ? 98 : 82;
      const pillHeight = isMobile ? 24 : 20;
      const pillX = badgeCenterX - pillWidth / 2;
      const pillY = badgeCenterY + 12;

      drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 9);
      ctx.fillStyle = isDarkText ? 'rgba(0, 0, 0, 0.20)' : 'rgba(0, 0, 0, 0.32)';
      ctx.fill();

      ctx.font = isMobile
        ? '800 13px monospace, sans-serif'
        : '700 10.5px monospace, sans-serif';
      ctx.fillStyle = badgeTextColor;
      ctx.fillText(tier.subtitle, badgeCenterX, pillY + pillHeight / 2);

      // Contador de discos (muestra "Top 20 de X" si excede 20)
      const countLabel =
        totalInTier > 20
          ? `Top 20 de ${totalInTier}`
          : `${totalInTier} ${totalInTier === 1 ? 'disco' : 'discos'}`;

      ctx.font = isMobile
        ? '800 12.5px "Gabarito", sans-serif'
        : '800 9.5px "Gabarito", sans-serif';
      ctx.fillStyle = isDarkText
        ? 'rgba(0, 0, 0, 0.75)'
        : 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(countLabel, badgeCenterX, badgeCenterY + 48);
    }

    // Bandeja de Álbumes (Derecha)
    const trayX = rowX + BADGE_WIDTH + TRAY_PADDING;
    const trayY = currentY + TRAY_PADDING;

    if (items.length === 0) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = isMobile
        ? 'italic 600 16px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
        : 'italic 500 13px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(
        '0 álbumes calificados',
        trayX + (rowWidth - BADGE_WIDTH - TRAY_PADDING * 2) / 2,
        currentY + rowHeight / 2
      );
    } else {
      items.forEach((item, idx) => {
        const col = idx % tilesPerRow;
        const row = Math.floor(idx / tilesPerRow);
        const tileX = trayX + col * (TILE_SIZE + TILE_GAP);
        const tileY = trayY + row * (TILE_SIZE + TILE_GAP);

        // Borde y fondo del cuadro
        drawRoundedRect(ctx, tileX, tileY, TILE_SIZE, TILE_SIZE, 12);
        ctx.fillStyle = '#0c0e1a';
        ctx.fill();

        // Dibujar carátula del álbum
        const loadedImg = imageMap.get(item.albumId);
        ctx.save();
        drawRoundedRect(ctx, tileX, tileY, TILE_SIZE, TILE_SIZE, 12);
        ctx.clip();

        if (loadedImg) {
          try {
            ctx.drawImage(loadedImg, tileX, tileY, TILE_SIZE, TILE_SIZE);
          } catch (e) {
            ctx.fillStyle = '#181b30';
            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          }
        } else {
          ctx.fillStyle = '#16192e';
          ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          ctx.beginPath();
          ctx.arc(
            tileX + TILE_SIZE / 2,
            tileY + TILE_SIZE / 2,
            TILE_SIZE / 3,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = '#262d47';
          ctx.fill();
        }

        // Gradiente oscuro inferior para la estrella y puntaje
        const gradHeight = isMobile ? 38 : 28;
        const scoreGrad = ctx.createLinearGradient(
          tileX,
          tileY + TILE_SIZE - gradHeight,
          tileX,
          tileY + TILE_SIZE
        );
        scoreGrad.addColorStop(0, 'transparent');
        scoreGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = scoreGrad;
        ctx.fillRect(tileX, tileY + TILE_SIZE - gradHeight, TILE_SIZE, gradHeight);

        // Calificación: Redondeada estrictamente hacia abajo (ej. 10 o 9.4)
        const displayScore =
          item.score === 10 ? '10' : item.score.toFixed(1);

        ctx.font = isMobile
          ? '900 17px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
          : '900 12px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(
          `★ ${displayScore}`,
          tileX + TILE_SIZE / 2,
          tileY + TILE_SIZE - (isMobile ? 15 : 12)
        );
        ctx.shadowBlur = 0;

        ctx.restore();

        // Borde final del tile
        drawRoundedRect(ctx, tileX, tileY, TILE_SIZE, TILE_SIZE, 12);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    currentY += rowHeight + ROW_GAP;
  }

  // 6. DIBUJAR FOOTER
  const footerY = CANVAS_HEIGHT - FOOTER_HEIGHT + (isMobile ? 20 : 14);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, footerY);
  ctx.lineTo(CANVAS_WIDTH - PADDING_X, footerY);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = isMobile
    ? '700 15px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
    : '600 12px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText(
    '✨ Musiclub • Club Oficial de Crítica de Álbumes',
    PADDING_X,
    footerY + (isMobile ? 24 : 18)
  );

  ctx.textAlign = 'right';
  ctx.font = isMobile
    ? '900 16px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif'
    : '800 12px "Gabarito", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#f5576c';
  ctx.fillText('musiclub.org', CANVAS_WIDTH - PADDING_X, footerY + (isMobile ? 24 : 18));

  return canvas;
}

export function TierListMaker({
  userReviews = [],
  albums = [],
  albumMap = new Map(),
  user = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cardSize, setCardSize] = useState('normal'); // 'normal' | 'compact'
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGeneratedSuccess, setImageGeneratedSuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Lista de álbumes clasificados automáticamente desde las reseñas del usuario
  // Con redondeo ESTRICTO hacia abajo para que ningún álbum muestre un puntaje fuera de su tier
  const classifiedItems = useMemo(() => {
    return userReviews.map((rev) => {
      const alb = albumMap.get(rev.album_id) || {
        id: rev.album_id,
        album: rev.album_title || 'Álbum Desconocido',
        artista: rev.album_artist || 'Artista',
        imagen: rev.album_image || PLACEHOLDER_COVER,
        status: 'INDIVIDUAL',
      };
      const rawScore = getWeightedReviewScore(rev) ?? rev.rating_general ?? 0;
      const score = roundDownScore(rawScore);
      const tier = getTierFromScore(score);

      return {
        reviewId: rev.id,
        albumId: rev.album_id || alb.id,
        album: alb.album || rev.album_title || 'Álbum',
        artista: alb.artista || rev.album_artist || 'Artista',
        imagen: alb.imagen || rev.album_image || PLACEHOLDER_COVER,
        rawScore: Number(rawScore),
        score,
        tier,
      };
    });
  }, [userReviews, albumMap]);

  // Agrupación automática por Tier (ordenados de mayor a menor calificación)
  const tierGroups = useMemo(() => {
    const groups = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      F: [],
    };

    classifiedItems.forEach((item) => {
      if (groups[item.tier]) {
        groups[item.tier].push(item);
      } else {
        groups.F.push(item);
      }
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) => (b.rawScore ?? b.score) - (a.rawScore ?? a.score)
      );
    });

    return groups;
  }, [classifiedItems]);

  // =========================================================================
  // GENERADOR DE IMAGEN NATIVO EN HTML5 CANVAS (2D)
  // Reutiliza generateTierListCanvas para exportar PNG en alta resolución
  // =========================================================================
  const handleDownloadImage = async () => {
    if (isGeneratingImage || classifiedItems.length === 0) return;
    setIsGeneratingImage(true);

    try {
      const resolvedUserName =
        user?.name || user?.email?.split('@')[0] || 'Melómano';
      const canvas = await generateTierListCanvas({
        classifiedItems,
        tierGroups,
        userName: resolvedUserName,
        user,
        totalCategorized: classifiedItems.length,
        format: 'mobile',
      });

      // DESCARGAR IMAGEN PNG
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeUserName = resolvedUserName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `musiclub-tierlist-${safeUserName}.png`;
      link.href = imageUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setImageGeneratedSuccess(true);
      setTimeout(() => setImageGeneratedSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating canvas tier list image:', err);
      alert(
        'Hubo un problema al generar la imagen. Por favor intenta de nuevo.'
      );
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const totalCategorized = classifiedItems.length;

  return (
    <div className="bg-gradient-to-br from-[#12142a] via-[#0d0f1e] to-[#070810] rounded-3xl p-4 sm:p-6 border border-pink-500/20 sm:border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-4 font-sans">
      {/* CABECERA CON LOGO OFICIAL DE MUSICLUB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 flex items-center justify-center p-2 flex-shrink-0 shadow-lg shadow-pink-500/10">
            <img
              src="/musiclub_logo_corchea.png"
              alt="Musiclub Logo"
              className="w-full h-full object-contain drop-shadow"
              onError={(e) => {
                e.target.src = '/musiclub_logo_3.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-xl font-black text-white tracking-wide">
                Tier List Automático (S-F Tiers)
              </h3>
              <span className="bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                {totalCategorized}{' '}
                {totalCategorized === 1
                  ? 'álbum clasificado'
                  : 'álbumes clasificados'}
              </span>
            </div>
            <p className="text-white/40 text-xs sm:text-[13px] mt-0.5">
              Tus álbumes evaluados ordenados automáticamente según tus
              calificaciones.
            </p>
          </div>
        </div>

        {/* CONTROLES Y HERRAMIENTAS */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Selector de tamaño de portadas (solo en escritorio) */}
          <div className="hidden sm:flex bg-black/40 p-1 rounded-xl border border-white/10 items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setCardSize('normal')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                cardSize === 'normal'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/40 hover:text-white'
              }`}
              title="Vista normal (portadas ampliadas)"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setCardSize('compact')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                cardSize === 'compact'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/40 hover:text-white'
              }`}
              title="Vista compacta"
            >
              Compacto
            </button>
          </div>

          {/* Botón Descargar Imagen */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGeneratingImage || totalCategorized === 0}
            className={`px-3 sm:px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Descargar imagen PNG de tu Tier List en alta resolución"
          >
            <span>
              {isGeneratingImage ? '⏳' : imageGeneratedSuccess ? '✅' : '📸'}
            </span>
            <span>
              {isGeneratingImage
                ? 'Generando...'
                : imageGeneratedSuccess
                  ? '¡Descargada!'
                  : 'Descargar'}
            </span>
          </button>

          {/* Botón Compartir en Redes Sociales */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            disabled={totalCategorized === 0}
            className="px-3.5 sm:px-4 py-2.5 bg-gradient-to-r from-[#f5576c] via-[#f43f5e] to-[#a855f7] hover:opacity-95 text-white text-xs sm:text-sm font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-pink-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Compartir tu Tier List en Instagram, TikTok, WhatsApp, X, Threads y más"
          >
            <ShareIcon className="w-4 h-4 text-white" />
            <span>Compartir en Redes</span>
          </button>
        </div>
      </div>

      {/* FILTRO RÁPIDO DE BÚSQUEDA */}
      {totalCategorized > 5 && (
        <div className="relative max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar álbum o artista en el Tier List..."
            className="w-full bg-black/40 border border-white/10 focus:border-pink-500/60 rounded-xl px-3.5 py-2 pl-8.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-pink-500/40 transition-all"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">
            🔍
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA INTERACTIVA DEL USUARIO                                            */}
      {/* ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-[#0c0d1c] p-2.5 sm:p-4 shadow-2xl space-y-3">
        {/* ENCABEZADO DE CABECERA VISUAL */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src="/musiclub_logo_corchea.png"
              alt="Musiclub Logo"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              onError={(e) => {
                e.target.src = '/musiclub_logo_3.png';
              }}
            />
            <span className="font-black text-white text-xs sm:text-sm tracking-wider">
              MUSICLUB <span className="text-pink-400">TIER LIST</span>
            </span>
          </div>
          <span className="text-xs text-white/50 font-medium">
            {user?.name || user?.email?.split('@')[0] || 'Melómano'} •{' '}
            {totalCategorized} álbumes
          </span>
        </div>

        {/* 1. VISTA MÓVIL DEDICADA (< sm) */}
        <div className="block sm:hidden space-y-3">
          {DEFAULT_TIERS.map((tier) => {
            const items = tierGroups[tier.id] || [];
            const filteredItems = items.filter((it) => {
              if (!searchTerm.trim()) return true;
              const term = searchTerm.toLowerCase();
              return (
                it.album.toLowerCase().includes(term) ||
                it.artista.toLowerCase().includes(term)
              );
            });
            // Máximo 20 (Top) releases en cada tier
            const displayItems = filteredItems.slice(0, 20);

            return (
              <div
                key={tier.id}
                className={`rounded-2xl border overflow-hidden ${tier.rowBg} ${tier.rowBorder}`}
              >
                {/* Cabecera del Tier en Móvil */}
                <div
                  className={`flex items-center justify-between p-3 border-b ${tier.mobileHeaderBg}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shadow-md ${tier.mobileBadgeBg}`}
                    >
                      {tier.label}
                    </span>
                    <div>
                      <h4 className="text-white font-black text-sm leading-tight">
                        {tier.name}
                      </h4>
                      <p className="text-white/60 text-xs font-mono font-bold">
                        {tier.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-black/40 px-2.5 py-1 rounded-full text-white/80 font-bold border border-white/10">
                    {items.length > 20
                      ? `Top 20 de ${items.length}`
                      : `${items.length} ${items.length === 1 ? 'disco' : 'discos'}`}
                  </span>
                </div>

                {/* Grid de Discos en Móvil (3 columnas con tamaño visual generoso) */}
                <div className="p-2.5 space-y-2">
                  {displayItems.length === 0 ? (
                    <div className="text-center py-4 text-white/40 text-xs italic">
                      {searchTerm
                        ? 'Sin coincidencias en este tier'
                        : '0 álbumes en este tier'}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {displayItems.map((item) => (
                          <div
                            key={item.albumId}
                            className="bg-black/40 rounded-xl overflow-hidden border border-white/10 flex flex-col justify-between shadow-sm"
                          >
                            <div className="aspect-square relative overflow-hidden bg-black/60">
                              <img
                                src={item.imagen}
                                alt={item.album}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = PLACEHOLDER_COVER;
                                }}
                              />
                              <div className="absolute top-1 right-1 bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10 text-xs font-black text-amber-300 shadow-md">
                                ★ {item.score === 10 ? '10' : item.score.toFixed(1)}
                              </div>
                            </div>
                            <div className="p-2">
                              <p
                                className="text-white font-bold text-xs leading-snug truncate"
                                title={item.album}
                              >
                                {item.album}
                              </p>
                              <p
                                className="text-white/60 text-[11px] truncate font-medium"
                                title={item.artista}
                              >
                                {item.artista}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredItems.length > 20 && (
                        <div className="text-center py-1 text-white/50 text-xs font-bold">
                          Mostrando el Top 20 de {filteredItems.length} álbumes en este tier
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. VISTA ESCRITORIO / TABLET (>= sm) */}
        <div className="hidden sm:block space-y-2.5">
          {DEFAULT_TIERS.map((tier) => {
            const items = tierGroups[tier.id] || [];
            const filteredItems = items.filter((it) => {
              if (!searchTerm.trim()) return true;
              const term = searchTerm.toLowerCase();
              return (
                it.album.toLowerCase().includes(term) ||
                it.artista.toLowerCase().includes(term)
              );
            });
            // Máximo 20 (Top) releases en cada tier
            const displayItems = filteredItems.slice(0, 20);

            return (
              <div
                key={tier.id}
                className={`flex rounded-2xl border transition-all overflow-hidden min-h-[96px] ${tier.rowBg} ${tier.rowBorder}`}
              >
                {/* Cabecera del Tier (Izquierda) */}
                <div
                  className={`w-28 sm:w-36 flex-shrink-0 flex flex-col items-center justify-center p-2.5 text-center select-none ${tier.headerBg} ${tier.headerText} shadow-md`}
                >
                  <span className="text-2xl sm:text-3xl font-black leading-none drop-shadow-md mb-0.5">
                    {tier.label}
                  </span>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider opacity-95 text-center leading-snug break-words max-w-full px-1">
                    {tier.name}
                  </span>
                  <span className="text-[11px] opacity-85 font-mono font-bold mt-1 bg-black/20 px-2.5 py-0.5 rounded-full">
                    {tier.subtitle}
                  </span>
                  <span className="text-[10px] mt-1 bg-black/30 px-2 py-0.5 rounded-full font-bold">
                    {items.length > 20
                      ? `Top 20 de ${items.length}`
                      : `${items.length} ${items.length === 1 ? 'disco' : 'discos'}`}
                  </span>
                </div>

                {/* Bandeja de Discos con tamaño visual ampliado y agradable */}
                <div className="flex-1 p-2.5 flex items-center gap-2.5 flex-wrap overflow-x-auto content-center min-h-[88px]">
                  {displayItems.length === 0 ? (
                    <div className="w-full text-center py-4 text-white/30 text-xs italic">
                      {searchTerm
                        ? 'Sin coincidencias en este tier'
                        : '0 álbumes calificados en este tier'}
                    </div>
                  ) : (
                    <>
                      {displayItems.map((item) => {
                        const isNormal = cardSize === 'normal';
                        return (
                          <div
                            key={item.albumId}
                            className={`group relative rounded-xl overflow-hidden border border-white/10 transition-all duration-200 flex-shrink-0 select-none shadow-md ${
                              isNormal
                                ? 'w-28 sm:w-32 aspect-square'
                                : 'w-20 sm:w-24 aspect-square'
                            }`}
                            title={`${item.album} - ${item.artista} (★ ${item.score === 10 ? '10' : item.score.toFixed(1)})`}
                        >
                          <img
                            src={item.imagen}
                            alt={item.album}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_COVER;
                            }}
                          />

                          {/* Badge de Calificación */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1 flex items-center justify-between">
                            <span className="text-[9px] sm:text-[10px] font-black text-amber-300 drop-shadow">
                              ★ {item.score === 10 ? '10' : item.score.toFixed(1)}
                            </span>
                          </div>

                          {/* Hover Tooltip Overlay */}
                          <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 flex flex-col justify-between text-left">
                            <div>
                              <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                                {item.album}
                              </p>
                              <p className="text-[8px] text-white/60 truncate">
                                {item.artista}
                              </p>
                            </div>
                            <span className="text-[8.5px] text-amber-300 font-bold">
                              ★ {item.score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PIE DE INFORMACIÓN */}
      <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 px-1">
        <span className="flex items-center gap-1.5">
          <span>✨</span>
          <span>Clasificación 100% automática basada en tus reseñas.</span>
        </span>
        <span className="font-semibold text-pink-300/80">
          Musiclub Tier System
        </span>
      </div>

      {/* Modal Compartir Tier List en Redes Sociales */}
      {isShareModalOpen && (
        <ShareTierListModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          user={user}
          classifiedItems={classifiedItems}
          tierGroups={tierGroups}
          totalCategorized={totalCategorized}
        />
      )}
    </div>
  );
}
