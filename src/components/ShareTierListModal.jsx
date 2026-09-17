// src/components/ShareTierListModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  XTwitterIcon,
  ThreadsIcon,
  FacebookIcon,
  TelegramIcon,
  RedditIcon,
  SnapchatIcon,
  ShareIcon,
  DownloadIcon,
  CopyImageIcon,
  LinkIcon,
} from './ShareReviewModal';
import { generateTierListCanvas } from './TierListMaker';
import { getMelomanoLevel } from '../utils/badgeSystem';

/**
 * Modal ultra-responsivo y optimizado para compartir la Tier List en Redes Sociales.
 * Diseñado con arquitectura móvil fija (100dvh) y formato vertical de pantalla completa
 * para celulares (Story 9:16 / 19.5:9), carátulas grandes y nítidas, y redondeo estricto
 * de calificaciones hacia abajo para respetar cada rango de tier.
 */
export default function ShareTierListModal({
  isOpen,
  onClose,
  user = null,
  classifiedItems = [],
  tierGroups = {},
  totalCategorized = 0,
}) {
  const [selectedFormat, setSelectedFormat] = useState('mobile'); // 'mobile' | 'landscape'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const userName = user?.name || user?.username || 'Melómano';
  const safeUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const melomanoLevel = user ? getMelomanoLevel(user.total_xp ?? 0) : null;

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  // URL del perfil donde vive la Tier List
  const profileUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://musiclub.org';
    const baseUrl = window.location.origin;
    if (user?.username) {
      return `${baseUrl}/perfil/${user.username}`;
    }
    if (user?.id) {
      return `${baseUrl}/perfil/${user.id}`;
    }
    return window.location.href;
  }, [user]);

  // Resumen de álbumes en Tier S para la caption
  const sTierNames = useMemo(() => {
    const sItems = tierGroups?.S || [];
    if (sItems.length === 0) return '';
    return sItems
      .slice(0, 3)
      .map((i) => `"${i.album}"`)
      .join(', ');
  }, [tierGroups]);

  // Texto sugerido optimizado para compartir
  const shareCaption = useMemo(() => {
    const sLine = sTierNames ? `\n🏆 En mi S-Tier: ${sTierNames}` : '';
    const userRank = melomanoLevel ? ` • ${melomanoLevel.title}` : '';
    return `🎵 ¡Checa mi Tier List oficial de álbumes en Musiclub! 💿✨${sLine}\n📊 ${totalCategorized} álbumes calificados por ${userName}${userRank}\n\n👉 Mira mi ranking completo y crea el tuyo en:\n${profileUrl}`;
  }, [sTierNames, totalCategorized, userName, melomanoLevel, profileUrl]);

  // Generador de imagen en canvas para el formato seleccionado
  const generateCanvasImage = useCallback(
    async (fmt = selectedFormat) => {
      if (!isOpen || classifiedItems.length === 0) return;
      setIsGenerating(true);

      try {
        const canvas = await generateTierListCanvas({
          classifiedItems,
          tierGroups,
          userName,
          user,
          totalCategorized: totalCategorized || classifiedItems.length,
          format: fmt,
        });

        const dataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(dataUrl);

        canvas.toBlob((blob) => {
          if (blob) {
            setImageBlob(blob);
            const file = new File(
              [blob],
              `musiclub-tierlist-${safeUserName}-${fmt}.png`,
              { type: 'image/png' }
            );
            setImageFile(file);
          }
        }, 'image/png');
      } catch (err) {
        console.error('Error generating tier list canvas for sharing:', err);
        showToast('⚠️ No se pudo generar la imagen del Tier List');
      } finally {
        setIsGenerating(false);
      }
    },
    [isOpen, classifiedItems, tierGroups, userName, user, totalCategorized, safeUserName, selectedFormat, showToast]
  );

  useEffect(() => {
    if (isOpen) {
      generateCanvasImage(selectedFormat);
    } else {
      setPreviewUrl(null);
      setImageBlob(null);
      setImageFile(null);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manejar cambio de formato (móvil vs panorámica)
  const handleFormatChange = (fmt) => {
    if (fmt === selectedFormat || isGenerating) return;
    setSelectedFormat(fmt);
    generateCanvasImage(fmt);
  };

  // Escuchar Escape y bloquear scroll del body
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

  // Descargar imagen HD
  const handleDownloadImage = useCallback(() => {
    if (!previewUrl) {
      showToast('⏳ Generando imagen...');
      return;
    }
    const link = document.createElement('a');
    link.download = `musiclub-tierlist-${safeUserName}-${selectedFormat}.png`;
    link.href = previewUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ ¡Imagen de tu Tier List descargada en HD!');
  }, [previewUrl, safeUserName, selectedFormat, showToast]);

  // Copiar imagen al portapapeles
  const handleCopyImage = useCallback(async () => {
    if (!imageBlob) {
      showToast('⏳ Espera a que termine de generarse la imagen');
      return;
    }
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': imageBlob }),
        ]);
        showToast('📋 ¡Imagen copiada al portapapeles!');
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.warn('Clipboard write image failed, downloading instead:', err);
      handleDownloadImage();
    }
  }, [imageBlob, handleDownloadImage, showToast]);

  // Copiar enlace directo
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast('🔗 ¡Enlace a tu Tier List copiado!');
    } catch {
      showToast('⚠️ No se pudo copiar el enlace');
    }
  }, [profileUrl, showToast]);

  // Copiar texto/caption
  const handleCopyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareCaption);
      showToast('📝 ¡Texto copiado para tus redes!');
    } catch {
      showToast('⚠️ No se pudo copiar el texto');
    }
  }, [shareCaption, showToast]);

  // Compartir Nativo (Web Share API)
  const handleNativeShare = useCallback(async () => {
    if (isGenerating) return;

    if (navigator.share) {
      try {
        const shareData = {
          title: `Tier List de Álbumes • ${userName}`,
          text: `🎵 ¡Checa mi ranking oficial de álbumes en Musiclub! 💿\n${profileUrl}`,
          url: profileUrl,
        };

        if (
          imageFile &&
          navigator.canShare &&
          navigator.canShare({ files: [imageFile] })
        ) {
          shareData.files = [imageFile];
        }

        await navigator.share(shareData);
        showToast('🚀 ¡Compartido con éxito!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, fallback to copy:', err);
        } else {
          return;
        }
      }
    }

    // Fallback: descargar imagen y copiar enlace
    handleDownloadImage();
    handleCopyLink();
    showToast('📥 Imagen descargada y enlace copiado');
  }, [isGenerating, userName, profileUrl, imageFile, handleDownloadImage, handleCopyLink, showToast]);

  // Acciones por red social específica
  const handleShareToPlatform = useCallback(
    async (platform) => {
      const encodedUrl = encodeURIComponent(profileUrl);
      const encodedText = encodeURIComponent(shareCaption);

      switch (platform) {
        case 'whatsapp': {
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
            `🎵 *Mi Tier List de Álbumes en Musiclub* 💿\n\n${shareCaption}`
          )}`;
          window.open(waUrl, '_blank', 'noopener,noreferrer');
          showToast('💬 Abriendo WhatsApp...');
          break;
        }

        case 'twitter': {
          const tweetText = encodeURIComponent(
            `Mi Tier List de álbumes en @Musiclub 🎧💿${
              sTierNames ? `\n🔥 S-Tier: ${sTierNames}` : ''
            }\n\n¿Qué opinas de mi ranking? Chécalo completo:`
          );
          const twUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}`;
          window.open(twUrl, '_blank', 'noopener,noreferrer');
          showToast('🐦 Abriendo X...');
          break;
        }

        case 'threads': {
          const threadsText = encodeURIComponent(
            `Mi Tier List de álbumes en Musiclub 💿${
              sTierNames ? `\n🏆 S-Tier: ${sTierNames}` : ''
            }\n\n¿Estás de acuerdo con mi ranking? Míralo aquí:`
          );
          const thUrl = `https://www.threads.net/intent/post?text=${threadsText}&url=${encodedUrl}`;
          window.open(thUrl, '_blank', 'noopener,noreferrer');
          showToast('🧵 Abriendo Threads...');
          break;
        }

        case 'facebook': {
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
          window.open(fbUrl, '_blank', 'noopener,noreferrer');
          showToast('📘 Abriendo Facebook...');
          break;
        }

        case 'telegram': {
          const tgUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
          window.open(tgUrl, '_blank', 'noopener,noreferrer');
          showToast('✈️ Abriendo Telegram...');
          break;
        }

        case 'reddit': {
          const rdTitle = encodeURIComponent(
            `Mi Tier List de Álbumes en Musiclub (${totalCategorized} discos calificados)`
          );
          const rdUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${rdTitle}`;
          window.open(rdUrl, '_blank', 'noopener,noreferrer');
          showToast('🤖 Abriendo Reddit...');
          break;
        }

        case 'instagram': {
          await handleCopyCaption();
          handleDownloadImage();
          showToast(
            '📸 Story HD descargada y texto copiado. Pégala en tu Instagram Stories',
            4000
          );
          window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
          break;
        }

        case 'tiktok': {
          await handleCopyCaption();
          handleDownloadImage();
          showToast(
            '🎵 Imagen descargada y texto copiado. Súbela a TikTok con #Musiclub',
            4000
          );
          window.open('https://www.tiktok.com', '_blank', 'noopener,noreferrer');
          break;
        }

        case 'snapchat': {
          await handleCopyCaption();
          handleDownloadImage();
          showToast('👻 Imagen guardada para tu historia de Snapchat', 4000);
          break;
        }

        default:
          break;
      }
    },
    [profileUrl, shareCaption, sTierNames, totalCategorized, handleCopyCaption, handleDownloadImage, showToast]
  );

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const socialPlatforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      bgClass: 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white',
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
      id: 'reddit',
      name: 'Reddit',
      bgClass: 'bg-[#FF4500] text-white',
      borderClass: 'border-orange-500/30',
      icon: <RedditIcon className="w-4 h-4 text-white" />,
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
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-2xl border border-white/30 animate-fadeIn whitespace-nowrap text-center pointer-events-none">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Fijo y Limpio */}
        <div className="flex-shrink-0 flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center p-2 text-white flex-shrink-0 shadow-md">
              <img
                src="/musiclub_logo_corchea.png"
                alt="Musiclub Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = '/musiclub_logo_3.png';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-white font-black text-xs sm:text-sm truncate">
                  Compartir Tier List
                </h3>
                <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 text-[10px] font-black border border-pink-500/30 flex-shrink-0">
                  HD · {totalCategorized} discos
                </span>
              </div>
              <p className="text-white/50 text-[11px] truncate leading-tight">
                {userName} {melomanoLevel ? `· ${melomanoLevel.title}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            title="Cerrar"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* 2. Área Central: Vista Previa Adaptativa al 100% del espacio */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 relative overflow-hidden">
          {/* Contenedor de la Imagen Story que escala a cualquier alto/ancho de celular */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Tier List Preview"
                className="max-h-full max-w-full object-contain rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] border border-white/20 select-none pointer-events-none transition-all duration-300"
              />
            ) : (
              <div className="w-48 aspect-[9/16] max-h-full flex flex-col items-center justify-center gap-2.5 text-white/50 bg-black/40 rounded-2xl border border-white/10 p-6 text-center shadow-inner">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-white/70">
                  Generando Tier List HD para Celular...
                </span>
              </div>
            )}
          </div>

          {/* Selector de Formato (📱 Celular / Story vs 🖥️ Panorámica) */}
          <div className="flex-shrink-0 flex items-center justify-center gap-1.5 mt-2 py-0.5 w-full">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleFormatChange('mobile')}
              className={`px-3 py-1 rounded-full text-[11px] font-black transition-all border cursor-pointer active:scale-95 ${
                selectedFormat === 'mobile'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.45)] scale-105'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              📱 Celular (Story 9:16)
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleFormatChange('landscape')}
              className={`px-3 py-1 rounded-full text-[11px] font-black transition-all border cursor-pointer active:scale-95 ${
                selectedFormat === 'landscape'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.45)] scale-105'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              🖥️ Panorámica (Feed)
            </button>
          </div>
        </div>

        {/* 3. Barra de Acciones Fija y Completa */}
        <div className="flex-shrink-0 border-t border-white/10 bg-[#070810]/95 backdrop-blur-md px-3 sm:px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] flex flex-col gap-2">
          {/* Botón Principal: Compartir Nativo a Stories / Apps */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleNativeShare}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-pink-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            title="Compartir directo a través del menú de tu teléfono"
          >
            <ShareIcon className="w-4 h-4 text-white" />
            <span>Compartir Nativo (Historias / Apps)</span>
          </button>

          {/* Fila de Acciones Directas (Copiar Imagen / Descargar HD / Enlace) */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleCopyImage}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Copiar imagen al portapapeles"
            >
              <CopyImageIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Copiar</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadImage}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Descargar imagen en alta resolución"
            >
              <DownloadIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Guardar</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="Copiar enlace a tu Tier List"
            >
              <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Enlace</span>
            </button>
          </div>

          {/* Grilla Compacta de Redes Sociales */}
          <div className="grid grid-cols-7 gap-1 pt-0.5">
            {socialPlatforms.slice(0, 7).map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={isGenerating}
                onClick={() => handleShareToPlatform(p.id)}
                className={`py-1.5 px-1 rounded-lg ${p.bgClass} border ${p.borderClass} flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform cursor-pointer disabled:opacity-50 shadow-sm`}
                title={`Compartir en ${p.name}`}
              >
                {p.icon}
                <span className="text-[9px] font-bold truncate max-w-full">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
