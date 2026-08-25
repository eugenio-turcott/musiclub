// src/components/TierListMaker.jsx
import React, { useState, useMemo } from 'react';
import { getWeightedReviewScore } from '../utils/ratingUtils';

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
    maxScore: 10,
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
    maxScore: 9.499,
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
    maxScore: 8.499,
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
    maxScore: 7.499,
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
    maxScore: 6.499,
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
    maxScore: 4.999,
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

// Helper para calcular el Tier automático según los criterios
function getTierFromScore(score) {
  if (score === null || score === undefined || isNaN(score)) return 'F';
  if (score >= 9.5) return 'S';
  if (score >= 8.5) return 'A';
  if (score >= 7.5) return 'B';
  if (score >= 6.5) return 'C';
  if (score >= 5.0) return 'D';
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

  // Lista de álbumes clasificados automáticamente desde las reseñas del usuario
  const classifiedItems = useMemo(() => {
    return userReviews.map((rev) => {
      const alb = albumMap.get(rev.album_id) || {
        id: rev.album_id,
        album: rev.album_title || 'Álbum Desconocido',
        artista: rev.album_artist || 'Artista',
        imagen: rev.album_image || PLACEHOLDER_COVER,
        status: 'INDIVIDUAL',
      };
      const score = getWeightedReviewScore(rev) ?? rev.rating_general ?? 0;
      const tier = getTierFromScore(score);

      return {
        reviewId: rev.id,
        albumId: rev.album_id || alb.id,
        album: alb.album || rev.album_title || 'Álbum',
        artista: alb.artista || rev.album_artist || 'Artista',
        imagen: alb.imagen || rev.album_image || PLACEHOLDER_COVER,
        score: Number(score),
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
      groups[key].sort((a, b) => (b.score || 0) - (a.score || 0));
    });

    return groups;
  }, [classifiedItems]);

  // =========================================================================
  // GENERADOR DE IMAGEN NATIVO EN HTML5 CANVAS (2D)
  // 100% nítido, sin error de canvas manchado, con portadas reales y tipografía
  // =========================================================================
  const handleDownloadImage = async () => {
    if (isGeneratingImage || classifiedItems.length === 0) return;
    setIsGeneratingImage(true);

    try {
      // 1. Precargar logo de Musiclub y portadas con CORS seguro
      const logoImgPromise = preloadCORSImage('/5662059.png');
      const albumImagesPromises = classifiedItems.map(async (item) => {
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

      // 2. Geometría y dimensiones de exportación (1200px de ancho)
      const CANVAS_WIDTH = 1200;
      const PADDING_X = 36;
      const HEADER_HEIGHT = 110;
      const FOOTER_HEIGHT = 64;
      const ROW_GAP = 14;
      const BADGE_WIDTH = 150;
      const TILE_SIZE = 90; // Tamaño generoso y nítido para los álbumes
      const TILE_GAP = 12;
      const TRAY_PADDING = 14;

      const availableTrayWidth =
        CANVAS_WIDTH - PADDING_X * 2 - BADGE_WIDTH - TRAY_PADDING * 2;
      const tilesPerRow = Math.max(
        1,
        Math.floor((availableTrayWidth + TILE_GAP) / (TILE_SIZE + TILE_GAP))
      );

      // Calcular altura por cada fila
      const tierLayouts = DEFAULT_TIERS.map((tier) => {
        const items = tierGroups[tier.id] || [];
        const rowsCount = Math.max(1, Math.ceil(items.length / tilesPerRow));
        const calculatedHeight =
          items.length === 0
            ? 104
            : rowsCount * TILE_SIZE +
              (rowsCount - 1) * TILE_GAP +
              TRAY_PADDING * 2;
        const rowHeight = Math.max(104, calculatedHeight);
        return { tier, items, rowHeight };
      });

      const totalRowsHeight = tierLayouts.reduce(
        (sum, t) => sum + t.rowHeight + ROW_GAP,
        0
      );
      const CANVAS_HEIGHT =
        HEADER_HEIGHT + totalRowsHeight + FOOTER_HEIGHT + 20;

      // 3. Crear canvas y contexto 2D (con escala x2 para máxima definición)
      const SCALE = 2;
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH * SCALE;
      canvas.height = CANVAS_HEIGHT * SCALE;
      const ctx = canvas.getContext('2d');
      ctx.scale(SCALE, SCALE);

      // Fondo general
      ctx.fillStyle = '#0a0c1a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sutil brillo radial de fondo
      const gradient = ctx.createRadialGradient(
        CANVAS_WIDTH / 2,
        HEADER_HEIGHT,
        100,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        CANVAS_WIDTH
      );
      gradient.addColorStop(0, '#151733');
      gradient.addColorStop(1, '#090a16');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 4. DIBUJAR ENCABEZADO
      const headerY = 28;
      // Logo
      if (logoImg) {
        ctx.drawImage(logoImg, PADDING_X, headerY, 52, 52);
      }

      // Título MUSICLUB TIER LIST
      const titleX = logoImg ? PADDING_X + 66 : PADDING_X;
      ctx.font =
        '900 26px "Stack Sans Notch", "Bowlby One SC", -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      ctx.fillText('MUSICLUB ', titleX, headerY + 4);

      const titleWidth = ctx.measureText('MUSICLUB ').width;
      ctx.fillStyle = '#f5576c';
      ctx.fillText('TIER LIST', titleX + titleWidth, headerY + 4);

      // Subtítulo
      ctx.font = '500 13px "Stack Sans Notch", -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(
        'Colección y ranking oficial de álbumes evaluados',
        titleX,
        headerY + 34
      );

      // Usuario a la derecha
      const userName = user?.name || user?.email?.split('@')[0] || 'Melómano';
      ctx.font = '800 18px "Stack Sans Notch", -apple-system, sans-serif';
      ctx.fillStyle = '#f093fb';
      ctx.textAlign = 'right';
      ctx.fillText(userName, CANVAS_WIDTH - PADDING_X, headerY + 6);

      ctx.font = '600 13px "Stack Sans Notch", -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(
        `${classifiedItems.length} álbumes calificados`,
        CANVAS_WIDTH - PADDING_X,
        headerY + 30
      );

      ctx.textAlign = 'left';

      // Línea divisoria del header
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PADDING_X, headerY + 68);
      ctx.lineTo(CANVAS_WIDTH - PADDING_X, headerY + 68);
      ctx.stroke();

      // 5. DIBUJAR FILAS DE TIERS
      let currentY = HEADER_HEIGHT + 10;

      for (const { tier, items, rowHeight } of tierLayouts) {
        const rowX = PADDING_X;
        const rowWidth = CANVAS_WIDTH - PADDING_X * 2;

        // Fondo y borde de toda la fila
        drawRoundedRect(ctx, rowX, currentY, rowWidth, rowHeight, 14);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Insignia / Cabecera Lateral del Tier (Izquierda)
        drawRoundedLeftRect(ctx, rowX, currentY, BADGE_WIDTH, rowHeight, 14);
        ctx.fillStyle = tier.hexColor;
        ctx.fill();

        // Contenido del Badge
        const isDarkText = tier.id === 'B' || tier.id === 'C';
        const badgeTextColor = isDarkText ? '#090d16' : '#ffffff';

        // Letra del Tier (S, A, B, C, D, F)
        ctx.textAlign = 'center';
        ctx.fillStyle = badgeTextColor;
        ctx.font = '900 38px "Stack Sans Notch", -apple-system, sans-serif';
        ctx.fillText(tier.label, rowX + BADGE_WIDTH / 2, currentY + 14);

        // Nombre del Tier (Obras Maestras, Excelentes, etc.)
        ctx.font = '900 11px "Stack Sans Notch", -apple-system, sans-serif';
        ctx.fillText(
          tier.name.toUpperCase(),
          rowX + BADGE_WIDTH / 2,
          currentY + 56
        );

        // Rango de puntuación (Pill)
        const pillY = currentY + 74;
        const pillWidth = 78;
        const pillHeight = 18;
        const pillX = rowX + (BADGE_WIDTH - pillWidth) / 2;

        drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 8);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fill();

        ctx.font = '700 10px monospace, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(tier.subtitle, rowX + BADGE_WIDTH / 2, pillY + 3.5);

        // Bandeja de Álbumes (Derecha)
        const trayX = rowX + BADGE_WIDTH + TRAY_PADDING;
        const trayY = currentY + TRAY_PADDING;

        if (items.length === 0) {
          ctx.textAlign = 'center';
          ctx.font =
            'italic 500 13px "Stack Sans Notch", -apple-system, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fillText(
            '0 álbumes calificados',
            trayX + (rowWidth - BADGE_WIDTH - TRAY_PADDING * 2) / 2,
            currentY + rowHeight / 2 - 6
          );
        } else {
          items.forEach((item, idx) => {
            const col = idx % tilesPerRow;
            const row = Math.floor(idx / tilesPerRow);
            const tileX = trayX + col * (TILE_SIZE + TILE_GAP);
            const tileY = trayY + row * (TILE_SIZE + TILE_GAP);

            // Borde y fondo del cuadro
            drawRoundedRect(ctx, tileX, tileY, TILE_SIZE, TILE_SIZE, 10);
            ctx.fillStyle = '#0c0e1a';
            ctx.fill();

            // Dibujar carátula del álbum
            const loadedImg = imageMap.get(item.albumId);
            ctx.save();
            drawRoundedRect(ctx, tileX, tileY, TILE_SIZE, TILE_SIZE, 10);
            ctx.clip();

            if (loadedImg) {
              try {
                ctx.drawImage(loadedImg, tileX, tileY, TILE_SIZE, TILE_SIZE);
              } catch (e) {
                // Si la imagen falla en runtime
                ctx.fillStyle = '#181b30';
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
              }
            } else {
              // Portada vinilo elegante de respaldo
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

            // Gradiente oscuro inferior para la estrella
            const scoreGrad = ctx.createLinearGradient(
              tileX,
              tileY + TILE_SIZE - 26,
              tileX,
              tileY + TILE_SIZE
            );
            scoreGrad.addColorStop(0, 'transparent');
            scoreGrad.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
            ctx.fillStyle = scoreGrad;
            ctx.fillRect(tileX, tileY + TILE_SIZE - 26, TILE_SIZE, 26);

            // Calificación ★ X.X
            ctx.font = '900 11px "Stack Sans Notch", -apple-system, sans-serif';
            ctx.fillStyle = '#fcd34d';
            ctx.textAlign = 'center';
            ctx.fillText(
              `★ ${item.score.toFixed(1)}`,
              tileX + TILE_SIZE / 2,
              tileY + TILE_SIZE - 15
            );

            ctx.restore();

            // Borde final del tile
            drawRoundedRect(ctx, tileX, tileY, TILE_SIZE, TILE_SIZE, 10);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        }

        currentY += rowHeight + ROW_GAP;
      }

      // 6. DIBUJAR FOOTER
      const footerY = CANVAS_HEIGHT - FOOTER_HEIGHT + 14;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING_X, footerY);
      ctx.lineTo(CANVAS_WIDTH - PADDING_X, footerY);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '600 12px "Stack Sans Notch", -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(
        '✨ Musiclub • Club Oficial de Crítica de Álbumes',
        PADDING_X,
        footerY + 16
      );

      ctx.textAlign = 'right';
      ctx.font = '800 12px "Stack Sans Notch", -apple-system, sans-serif';
      ctx.fillStyle = '#f5576c';
      ctx.fillText('musiclub.app', CANVAS_WIDTH - PADDING_X, footerY + 16);

      // 7. DESCARGAR IMAGEN PNG
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
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
    <div className="bg-gradient-to-br from-[#12142a] via-[#0d0f1e] to-[#070810] rounded-3xl p-4 sm:p-6 border border-pink-500/20 sm:border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-4 font-['Stack_Sans_Notch',sans-serif]">
      {/* CABECERA CON LOGO OFICIAL DE MUSICLUB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 flex items-center justify-center p-2 flex-shrink-0 shadow-lg shadow-pink-500/10">
            <img
              src="/5662059.png"
              alt="Musiclub Logo"
              className="w-full h-full object-contain drop-shadow"
              onError={(e) => {
                e.target.style.display = 'none';
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

          {/* Botón Generar / Descargar Imagen */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGeneratingImage || totalCategorized === 0}
            className={`px-4 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-pink-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Generar imagen PNG de tu Tier List en alta resolución"
          >
            <span>
              {isGeneratingImage ? '⏳' : imageGeneratedSuccess ? '✅' : '📸'}
            </span>
            <span>
              {isGeneratingImage
                ? 'Generando imagen...'
                : imageGeneratedSuccess
                  ? '¡Imagen Descargada!'
                  : 'Descargar Imagen'}
            </span>
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
              src="/5662059.png"
              alt="Musiclub Logo"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
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

            return (
              <div
                key={tier.id}
                className={`rounded-2xl border overflow-hidden ${tier.rowBg} ${tier.rowBorder}`}
              >
                {/* Cabecera del Tier en Móvil */}
                <div
                  className={`flex items-center justify-between p-2.5 border-b ${tier.mobileHeaderBg}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${tier.mobileBadgeBg}`}
                    >
                      {tier.label}
                    </span>
                    <div>
                      <h4 className="text-white font-black text-xs leading-tight">
                        {tier.name}
                      </h4>
                      <p className="text-white/50 text-[10px] font-mono">
                        {tier.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full text-white/70 font-bold border border-white/10">
                    {items.length} {items.length === 1 ? 'disco' : 'discos'}
                  </span>
                </div>

                {/* Grid de Discos en Móvil (3 columnas con tamaño visual generoso) */}
                <div className="p-2.5">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-3 text-white/30 text-xs italic">
                      {searchTerm
                        ? 'Sin coincidencias en este tier'
                        : '0 álbumes en este tier'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {filteredItems.map((item) => (
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
                            <div className="absolute top-1 right-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/10 text-[9px] font-black text-amber-300">
                              ★ {item.score.toFixed(1)}
                            </div>
                          </div>
                          <div className="p-1.5">
                            <p
                              className="text-white font-bold text-[10px] leading-tight truncate"
                              title={item.album}
                            >
                              {item.album}
                            </p>
                            <p
                              className="text-white/50 text-[8.5px] truncate"
                              title={item.artista}
                            >
                              {item.artista}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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

            return (
              <div
                key={tier.id}
                className={`flex rounded-2xl border transition-all overflow-hidden min-h-[96px] ${tier.rowBg} ${tier.rowBorder}`}
              >
                {/* Cabecera del Tier (Izquierda) */}
                <div
                  className={`w-28 sm:w-32 flex-shrink-0 flex flex-col items-center justify-center p-2.5 text-center select-none ${tier.headerBg} ${tier.headerText} shadow-md`}
                >
                  <span className="text-2xl sm:text-3xl font-black leading-none drop-shadow-md mb-0.5">
                    {tier.label}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider opacity-95 text-center leading-snug break-words max-w-full px-1">
                    {tier.name}
                  </span>
                  <span className="text-[9px] opacity-85 font-mono font-bold mt-1 bg-black/20 px-2 py-0.5 rounded-full">
                    {tier.subtitle}
                  </span>
                  <span className="text-[8.5px] mt-0.5 bg-black/30 px-1.5 py-0.2 rounded-full font-bold">
                    {items.length} {items.length === 1 ? 'disco' : 'discos'}
                  </span>
                </div>

                {/* Bandeja de Discos con tamaño visual ampliado y agradable */}
                <div className="flex-1 p-2.5 flex items-center gap-2.5 flex-wrap overflow-x-auto content-center min-h-[88px]">
                  {filteredItems.length === 0 ? (
                    <div className="w-full text-center py-4 text-white/25 text-xs italic">
                      {searchTerm
                        ? 'Sin coincidencias en este tier'
                        : '0 álbumes calificados en este tier'}
                    </div>
                  ) : (
                    filteredItems.map((item) => {
                      const isNormal = cardSize === 'normal';
                      return (
                        <div
                          key={item.albumId}
                          className={`group relative rounded-xl overflow-hidden border border-white/10 transition-all duration-200 flex-shrink-0 select-none shadow-md ${
                            isNormal
                              ? 'w-28 sm:w-32 aspect-square'
                              : 'w-20 sm:w-24 aspect-square'
                          }`}
                          title={`${item.album} - ${item.artista} (★ ${item.score.toFixed(1)})`}
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
                              ★ {item.score.toFixed(1)}
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
                    })
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
    </div>
  );
}
