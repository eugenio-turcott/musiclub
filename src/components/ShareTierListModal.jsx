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

/**
 * Modal para compartir la Tier List de un usuario en Redes Sociales
 * Genera imagen HD desde el canvas nativo y ofrece botones oficiales
 * para Instagram, TikTok, WhatsApp, X (Twitter), Threads, Facebook, Telegram,
 * Reddit, Snapchat, Compartir Nativo (Web Share API) y Portapapeles.
 */
export default function ShareTierListModal({
  isOpen,
  onClose,
  user = null,
  classifiedItems = [],
  tierGroups = {},
  totalCategorized = 0,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const userName = user?.name || user?.username || 'Melómano';
  const safeUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  // URL del perfil donde vive la Tier List
  const profileUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://musiclub.com';
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

  // Texto optimizado para compartir en redes
  const shareCaption = useMemo(() => {
    const sLine = sTierNames ? `\n🏆 En mi S-Tier: ${sTierNames}` : '';
    return `🎵 ¡Checa mi Tier List de álbumes en Musiclub! 💿${sLine}\n📊 ${totalCategorized} álbumes calificados\n👉 Mira mi ranking completo y crea el tuyo en Musiclub:\n${profileUrl}`;
  }, [sTierNames, totalCategorized, profileUrl]);

  // Generar imagen en canvas al abrir el modal
  const generateCanvasImage = useCallback(async () => {
    if (!isOpen || classifiedItems.length === 0) return;
    setIsGenerating(true);

    try {
      const canvas = await generateTierListCanvas({
        classifiedItems,
        tierGroups,
        userName,
        totalCategorized,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);

      // Convertir a Blob y File para Web Share API y Portapapeles
      canvas.toBlob((blob) => {
        if (blob) {
          setImageBlob(blob);
          const file = new File([blob], `musiclub-tierlist-${safeUserName}.png`, {
            type: 'image/png',
          });
          setImageFile(file);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error generating tier list canvas for sharing:', err);
      showToast('⚠️ No se pudo generar la imagen del Tier List');
    } finally {
      setIsGenerating(false);
    }
  }, [isOpen, classifiedItems, tierGroups, userName, totalCategorized, safeUserName, showToast]);

  useEffect(() => {
    if (isOpen) {
      generateCanvasImage();
    } else {
      setPreviewUrl(null);
      setImageBlob(null);
      setImageFile(null);
    }
  }, [isOpen, generateCanvasImage]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll de fondo cuando el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Descarga directa del archivo PNG HD
  const handleDownloadImage = useCallback(() => {
    if (!previewUrl) {
      showToast('⏳ Generando imagen...');
      return;
    }
    const link = document.createElement('a');
    link.download = `musiclub-tierlist-${safeUserName}.png`;
    link.href = previewUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ ¡Imagen de tu Tier List descargada en HD!');
  }, [previewUrl, safeUserName, showToast]);

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
        setCopiedImage(true);
        showToast('📋 ¡Imagen copiada al portapapeles!');
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.warn('Clipboard write image failed, downloading instead:', err);
      handleDownloadImage();
    }
  }, [imageBlob, handleDownloadImage, showToast]);

  // Copiar enlace al portapapeles
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      showToast('🔗 ¡Enlace a tu Tier List copiado!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('⚠️ No se pudo copiar el enlace automáticamente');
    }
  }, [profileUrl, showToast]);

  // Copiar texto/caption
  const handleCopyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareCaption);
      setCopiedCaption(true);
      showToast('📝 ¡Texto copiado para pegar en tus redes!');
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      showToast('⚠️ No se pudo copiar el texto');
    }
  }, [shareCaption, showToast]);

  // Compartir Nativo (Web Share API)
  const handleNativeShare = useCallback(async () => {
    try {
      if (navigator.share) {
        const shareData = {
          title: `Tier List de Álbumes de ${userName} • Musiclub`,
          text: shareCaption,
          url: profileUrl,
        };

        if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          shareData.files = [imageFile];
        }

        await navigator.share(shareData);
        showToast('🚀 ¡Compartido con éxito!');
      } else {
        handleCopyLink();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleCopyLink();
      }
    }
  }, [userName, shareCaption, profileUrl, imageFile, showToast, handleCopyLink]);

  // Acciones por red social específica
  const handleShareToPlatform = useCallback(
    async (platform) => {
      const encodedUrl = encodeURIComponent(profileUrl);
      const encodedText = encodeURIComponent(shareCaption);

      switch (platform) {
        case 'whatsapp': {
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
            `🎵 *Tier List de Álbumes en Musiclub* 💿\n\n${shareCaption}`
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
          showToast('🐦 Abriendo X (Twitter)...');
          break;
        }

        case 'threads': {
          const threadsText = encodeURIComponent(
            `Mi Tier List de álbumes en Musiclub 💿${
              sTierNames ? `\n🏆 S-Tier: ${sTierNames}` : ''
            }\n\n¿Estás de acuerdo o en desacuerdo? Checa todos mis tiers:`
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
            '📸 Imagen descargada y texto copiado. Pégala en tu Instagram Stories o Feed',
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
          showToast(
            '👻 Imagen guardada. Pégala en tu historia de Snapchat',
            4000
          );
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

  const modalContent = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999999] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Contenedor Modal */}
      <div
        className="relative w-full max-w-4xl bg-[#0d0f1c] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Flotante */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-2xl shadow-2xl border border-white/30 animate-bounce text-center">
            {toastMessage}
          </div>
        )}

        {/* Header del Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 flex items-center justify-center p-2 shadow-inner">
              <img
                src="/5662059.png"
                alt="Musiclub Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-2">
                <span>Compartir Tier List</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  HD
                </span>
              </h2>
              <p className="text-xs text-white/60 font-medium">
                Publica tu ranking de álbumes en redes sociales con diseño oficial de Musiclub.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer"
            title="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal: 2 Columnas (Preview + Acciones) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: Preview del Tier List (7 cols en md) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center space-y-3">
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl flex items-center justify-center min-h-[260px] p-2">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-10 h-10 border-3 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                  <span className="text-xs font-bold text-white/80 animate-pulse">
                    Generando imagen HD de tu Tier List...
                  </span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Vista previa del Tier List"
                  className="w-full h-auto max-h-[60vh] object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-xs text-white/40 text-center py-12">
                  No se pudo cargar la vista previa
                </div>
              )}
            </div>

            <p className="text-[11px] text-white/40 text-center flex items-center justify-center gap-1.5 font-medium">
              <span>📐</span>
              <span>
                Resolución 2400px HD optimizada para feeds y stories • Formato PNG nítido
              </span>
            </p>
          </div>

          {/* COLUMNA DERECHA: Botones y Opciones de Compartir (5 cols en md) */}
          <div className="md:col-span-5 space-y-4">
            {/* ACCIONES RÁPIDAS PRINCIPALES */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-400 block">
                Acciones Principales
              </span>

              {/* Botón Compartir Nativo (Ideal para Celulares / Stories) */}
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={isGenerating || !previewUrl}
                className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-pink-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShareIcon className="w-5 h-5 text-white" />
                <span>Compartir Nativo (Historias / Apps)</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Copiar Imagen al Portapapeles */}
                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={isGenerating || !previewUrl}
                  className="py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Copiar imagen PNG al portapapeles"
                >
                  <CopyImageIcon className="w-4 h-4 text-pink-400" />
                  <span>{copiedImage ? '¡Copiada!' : 'Copiar Imagen'}</span>
                </button>

                {/* Descargar Imagen HD */}
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isGenerating || !previewUrl}
                  className="py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Descargar archivo PNG en alta resolución"
                >
                  <DownloadIcon className="w-4 h-4 text-cyan-400" />
                  <span>Descargar HD</span>
                </button>
              </div>

              {/* Copiar Enlace Directo */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5 text-white/60" />
                <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace a mi Tier List'}</span>
              </button>
            </div>

            {/* REDES SOCIALES OFICIALES */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/60 block">
                Publicar Directamente en Redes
              </span>

              <div className="grid grid-cols-3 gap-2">
                {/* Instagram */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('instagram')}
                  disabled={isGenerating || !previewUrl}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-tr from-[#833ab4]/15 via-[#fd1d1d]/15 to-[#fcb045]/15 hover:from-[#833ab4]/30 hover:to-[#fcb045]/30 border border-pink-500/30 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <InstagramIcon className="w-6 h-6 text-[#E1306C] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">Instagram</span>
                </button>

                {/* TikTok */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('tiktok')}
                  disabled={isGenerating || !previewUrl}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-cyan-500/30 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <TikTokIcon className="w-6 h-6 text-[#25F4EE] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">TikTok</span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('whatsapp')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <WhatsAppIcon className="w-6 h-6 text-[#25D366] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">WhatsApp</span>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('twitter')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <XTwitterIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">X (Twitter)</span>
                </button>

                {/* Threads */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('threads')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <ThreadsIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">Threads</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('facebook')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <FacebookIcon className="w-6 h-6 text-[#1877F2] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">Facebook</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('telegram')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <TelegramIcon className="w-6 h-6 text-[#229ED9] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">Telegram</span>
                </button>

                {/* Reddit */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('reddit')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FF4500]/10 hover:bg-[#FF4500]/20 border border-[#FF4500]/30 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <RedditIcon className="w-6 h-6 text-[#FF4500] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">Reddit</span>
                </button>

                {/* Snapchat */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('snapchat')}
                  disabled={isGenerating || !previewUrl}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FFFC00]/10 hover:bg-[#FFFC00]/20 border border-[#FFFC00]/30 transition-all active:scale-95 text-white group cursor-pointer"
                >
                  <SnapchatIcon className="w-6 h-6 text-[#FFFC00] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold mt-1 text-white/90">Snapchat</span>
                </button>
              </div>
            </div>

            {/* PREVISUALIZACIÓN DE TEXTO / CAPTION */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">
                  Texto sugerido para tu post:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="text-[10px] font-bold text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
                >
                  {copiedCaption ? '¡Copiado!' : 'Copiar Texto'}
                </button>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-left text-xs text-white/70 max-h-24 overflow-y-auto whitespace-pre-wrap select-all font-mono leading-relaxed">
                {shareCaption}
              </div>
            </div>

            {/* TIP PARA MÓVILES */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/20 text-[11px] text-white/80 leading-relaxed">
              💡 <strong>Tip para celular:</strong> Usa el botón{' '}
              <strong className="text-pink-300">Compartir Nativo</strong> para enviar tu Tier List directamente a tus{' '}
              <strong>Instagram Stories</strong> o <strong>WhatsApp</strong> sin tener que guardar la imagen manualmente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
