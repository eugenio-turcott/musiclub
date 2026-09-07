// src/components/ShareReviewModal.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  getWeightedReviewScore,
  getTrackDisplayName,
  getEmotionFromReview,
  getReviewFavoriteTrack,
  getReleaseUrl,
} from '../utils/ratingUtils';

// =========================================================================
// TEMAS ESTÉTICOS DE DISEÑO STORY 9:16
// =========================================================================
export const THEMES = [
  {
    id: 'neon',
    name: '🌌 Musiclub Neon',
    bgColors: ['#0f0a20', '#0b0d1a', '#05060b'],
    glow1: 'rgba(244, 63, 94, 0.22)',
    glow2: 'rgba(168, 85, 247, 0.18)',
    coverBorder: 'rgba(244, 63, 94, 0.55)',
    accentColor: '#f5576c',
    scorePillGrad: ['#f5576c', '#f093fb'],
    scoreTextColor: '#ffffff',
    vinylLabelGrad: ['#f5576c', '#e11d48', '#9333ea'],
  },
  {
    id: 'onyx',
    name: '🖤 Onyx Minimal',
    bgColors: ['#18181b', '#09090b', '#000000'],
    glow1: 'rgba(255, 255, 255, 0.08)',
    glow2: 'rgba(255, 255, 255, 0.04)',
    coverBorder: 'rgba(255, 255, 255, 0.4)',
    accentColor: '#ffffff',
    scorePillGrad: ['#ffffff', '#e4e4e7'],
    scoreTextColor: '#000000',
    vinylLabelGrad: ['#ffffff', '#a1a1aa', '#3f3f46'],
  },
  {
    id: 'vinyl',
    name: '💿 Retro Vinyl',
    bgColors: ['#241407', '#120903', '#060301'],
    glow1: 'rgba(245, 158, 11, 0.25)',
    glow2: 'rgba(217, 119, 6, 0.15)',
    coverBorder: 'rgba(245, 158, 11, 0.55)',
    accentColor: '#f59e0b',
    scorePillGrad: ['#f59e0b', '#fbbf24'],
    scoreTextColor: '#000000',
    vinylLabelGrad: ['#f59e0b', '#d97706', '#92400e'],
  },
  {
    id: 'cyber',
    name: '🔮 Cyber Aura',
    bgColors: ['#04101e', '#071529', '#0d071a'],
    glow1: 'rgba(6, 182, 212, 0.25)',
    glow2: 'rgba(217, 70, 239, 0.2)',
    coverBorder: 'rgba(6, 182, 212, 0.55)',
    accentColor: '#06b6d4',
    scorePillGrad: ['#06b6d4', '#d946ef'],
    scoreTextColor: '#ffffff',
    vinylLabelGrad: ['#06b6d4', '#8b5cf6', '#d946ef'],
  },
];

// =========================================================================
// LOGOS VECTORIALES OFICIALES SVG
// =========================================================================
export function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689-.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function TikTokIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function XTwitterIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ThreadsIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" />
    </svg>
  );
}

export function FacebookIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function TelegramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
    </svg>
  );
}

export function RedditIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.56 1.25 1.248a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.56 12 8 12.56 8 13.25c0 .688.56 1.25 1.25 1.25.688 0 1.248-.562 1.248-1.25 0-.69-.56-1.25-1.248-1.25zm5.5 0c-.688 0-1.25.56-1.25 1.25 0 .688.562 1.25 1.25 1.25.69 0 1.25-.562 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.465 4.417c-.12-.03-.23.036-.26.156-.03.12.036.23.156.26 1.096.273 2.21.293 3.32.06.12-.025.195-.143.17-.263-.024-.12-.142-.195-.262-.17-1.008.21-2.02.193-3.124-.043z" />
    </svg>
  );
}

export function SnapchatIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
    </svg>
  );
}

export function SpotifyIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.307c-.22.355-.68.468-1.035.25-2.834-1.732-6.402-2.124-10.603-1.164-.403.093-.807-.156-.9-.558-.093-.404.156-.807.558-.9 4.603-1.05 8.56-.61 11.73 1.336.356.218.468.679.25 1.036zm1.472-3.275c-.276.448-.863.59-1.311.314-3.245-1.995-8.192-2.571-12.03-1.405-.506.153-1.042-.136-1.196-.641-.153-.505.136-1.041.642-1.196 4.385-1.33 9.837-.692 13.58 1.616.449.277.591.864.315 1.312zm.126-3.41c-3.89-2.31-10.306-2.523-14.02-1.396-.597.181-1.233-.162-1.414-.759-.181-.597.162-1.233.759-1.414 4.271-1.296 11.354-1.045 15.823 1.609.537.319.712 1.012.394 1.549-.319.537-1.012.712-1.542.411z" />
    </svg>
  );
}

export function ShareIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export function DownloadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function CopyImageIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function LinkIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// =========================================================================
// HELPERS DE RENDERIZADO CANVAS 2D
// =========================================================================

export function getSafeCORSUrl(url) {
  if (!url || typeof url !== 'string') return null;
  // Rutas locales relativas, blob: o data: URLs son siempre seguras
  if (
    url.startsWith('/') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  // Si ya contiene el proxy wsrv.nl, no re-encapsular
  if (url.includes('wsrv.nl')) {
    return url;
  }
  // Dominios que sabemos positivamente que envían cabecera Access-Control-Allow-Origin: *
  const isDirectCORSAllowed =
    /i\.scdn\.co|supabase\.co|coverartarchive\.org|archive\.org/i.test(url);
  if (isDirectCORSAllowed) {
    return url;
  }
  // Para Pinterest (*.pinimg.com) y cualquier otro dominio externo sin CORS garantizado:
  // enrutar de forma proactiva por wsrv.nl para evitar el error en la consola del navegador
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
      // Si la URL segura a través del proxy falló, intentar directo como fallback
      if (targetUrl !== src) {
        const directImg = new Image();
        directImg.onload = () => resolve(directImg);
        directImg.onerror = () => resolve(null);
        directImg.src = src;
      } else {
        // Si era directo y falló, intentar a través de wsrv.nl
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

// =========================================================================
// GENERADOR NATIVO CANVAS 2D FULL HD 1080x1920 (FORMATO CELULAR 9:16)
// =========================================================================
export async function generateReviewStoryCanvas({
  review,
  album: rawAlbum,
  currentUser = null,
  themeId = 'neon',
  showVinylDisc = true,
  showComment = true,
  showCriteria = true,
  showTracks = true,
}) {
  // Asegurar que las fuentes web estén listas
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

  // Calificación final ponderada
  let finalScore = '10.0';
  const s = getWeightedReviewScore(review) ?? review?.rating_general;
  if (s !== null && s !== undefined && !isNaN(Number(s))) {
    finalScore = Number(s).toFixed(1);
  }

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

  // Criterios de evaluación (hasta 6)
  const criteria = [
    { icon: '🎛️', label: 'PRODUCCIÓN', val: review?.rating_produccion },
    { icon: '🎵', label: 'COMPOSICIÓN', val: review?.rating_composicion },
    { icon: '📝', label: 'LETRAS', val: review?.rating_letras },
    { icon: '💡', label: 'ORIGINALIDAD', val: review?.rating_originalidad },
    { icon: '🔗', label: 'COHESIÓN', val: review?.rating_cohesion },
    { icon: '🔄', label: 'REPLAY', val: review?.rating_replay },
  ]
    .filter(
      (c) => c.val !== undefined && c.val !== null && !isNaN(Number(c.val))
    )
    .map((c) => ({
      icon: c.icon,
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
  const [logoImg, coverImg, avatarImg] = await Promise.all([
    preloadCORSImage('/5662059.png'),
    preloadCORSImage(album.image_url),
    preloadCORSImage(reviewerAvatar),
  ]);

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  // Crear canvas en 1080 x 1920 (9:16 nativo)
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
  const glow1 = ctx.createRadialGradient(920, 200, 50, 920, 200, 600);
  glow1.addColorStop(0, theme.glow1);
  glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, 1080, 1920);

  const glow2 = ctx.createRadialGradient(150, 1720, 50, 150, 1720, 650);
  glow2.addColorStop(0, theme.glow2);
  glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, 1080, 1920);

  // 3. HEADER FIJO (y: 64 a 165)
  // Caja de logo de la app
  drawRoundedRect(ctx, 64, 64, 76, 76, 20);
  const logoBoxGrad = ctx.createLinearGradient(64, 64, 140, 140);
  logoBoxGrad.addColorStop(0, '#1c1c28');
  logoBoxGrad.addColorStop(1, '#0e0f17');
  ctx.fillStyle = logoBoxGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (logoImg) {
    ctx.drawImage(logoImg, 74, 74, 56, 56);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Stack Sans Notch", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M', 102, 115);
  }

  // Título de la app
  ctx.textAlign = 'left';
  ctx.font = '900 34px "Stack Sans Notch", -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Musiclub', 158, 98);

  ctx.font = '800 16px "Stack Sans Notch", -apple-system, sans-serif';
  ctx.fillStyle = theme.accentColor;
  ctx.fillText('CRÍTICA MUSICAL', 158, 126);

  // Píldora de fecha
  const dateStr = formatReviewDate(review?.created_at || review?.review_date);
  if (dateStr) {
    const dText = `🗓️ ${dateStr}`;
    ctx.font = '700 18px "Stack Sans Notch", sans-serif';
    const dW = ctx.measureText(dText).width + 36;
    const dX = 1080 - 64 - dW;
    drawRoundedRect(ctx, dX, 78, dW, 46, 23);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(dText, dX + dW / 2, 107);
  }

  // Divisor de cabecera
  ctx.beginPath();
  ctx.moveTo(64, 165);
  ctx.lineTo(1080 - 64, 165);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 4. PORTADA DE ÁLBUM + DISCO DE VINILO 3D
  const coverSize = showVinylDisc ? 400 : 410;
  const coverX = showVinylDisc ? 255 : 340;
  const coverY = 195;

  if (showVinylDisc) {
    const vx = 695;
    const vy = coverY + coverSize / 2;
    const vr = 190;

    // Sombra del vinilo
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetX = 12;
    ctx.shadowOffsetY = 16;
    ctx.beginPath();
    ctx.arc(vx, vy, vr, 0, Math.PI * 2);
    const vinylGrad = ctx.createLinearGradient(
      vx - vr,
      vy - vr,
      vx + vr,
      vy + vr
    );
    vinylGrad.addColorStop(0, '#1c1c1c');
    vinylGrad.addColorStop(0.5, '#0e0e0e');
    vinylGrad.addColorStop(1, '#151515');
    ctx.fillStyle = vinylGrad;
    ctx.fill();
    ctx.restore();

    // Surcos circulares del disco
    [170, 150, 130, 110, 90].forEach((r) => {
      ctx.beginPath();
      ctx.arc(vx, vy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Etiqueta del disco con gradiente del tema
    ctx.beginPath();
    ctx.arc(vx, vy, 62, 0, Math.PI * 2);
    const labelGrad = ctx.createLinearGradient(
      vx - 62,
      vy - 62,
      vx + 62,
      vy + 62
    );
    labelGrad.addColorStop(0, theme.vinylLabelGrad[0]);
    labelGrad.addColorStop(0.5, theme.vinylLabelGrad[1]);
    labelGrad.addColorStop(1, theme.vinylLabelGrad[2]);
    ctx.fillStyle = labelGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Orificio central
    ctx.beginPath();
    ctx.arc(vx, vy, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0c1a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Renderizar portada
  ctx.save();
  drawRoundedRect(ctx, coverX, coverY, coverSize, coverSize, 24);
  ctx.clip();
  if (coverImg) {
    ctx.drawImage(coverImg, coverX, coverY, coverSize, coverSize);
  } else {
    ctx.fillStyle = '#1c1c28';
    ctx.fillRect(coverX, coverY, coverSize, coverSize);
  }
  // Sombra suave encima de la portada
  const coverShadow = ctx.createLinearGradient(
    coverX,
    coverY,
    coverX,
    coverY + coverSize
  );
  coverShadow.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  coverShadow.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = coverShadow;
  ctx.fillRect(coverX, coverY, coverSize, coverSize);
  ctx.restore();

  // Borde nítido de la carátula
  drawRoundedRect(ctx, coverX, coverY, coverSize, coverSize, 24);
  ctx.strokeStyle = theme.coverBorder;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 5. TÍTULOS DEL LANZAMIENTO (y: 650 a 735)
  ctx.textAlign = 'center';
  ctx.font = '900 44px "Stack Sans Notch", -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  let albumTitleToDraw = album.album_name;
  if (ctx.measureText(albumTitleToDraw).width > 920) {
    while (
      albumTitleToDraw.length > 5 &&
      ctx.measureText(albumTitleToDraw + '…').width > 920
    ) {
      albumTitleToDraw = albumTitleToDraw.slice(0, -1);
    }
    albumTitleToDraw += '…';
  }
  ctx.fillText(albumTitleToDraw, 540, 680);

  ctx.font = '700 26px "Stack Sans Notch", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  let artistToDraw = album.artist_name;
  if (ctx.measureText(artistToDraw).width > 920) {
    while (
      artistToDraw.length > 5 &&
      ctx.measureText(artistToDraw + '…').width > 920
    ) {
      artistToDraw = artistToDraw.slice(0, -1);
    }
    artistToDraw += '…';
  }
  ctx.fillText(artistToDraw, 540, 720);

  // Píldora Tipo · Año
  const typeText = [
    album.release_type?.toUpperCase() || 'ÁLBUM',
    album.release_year,
  ]
    .filter(Boolean)
    .join(' · ');
  ctx.font = '800 15px "Stack Sans Notch", sans-serif';
  const typeW = ctx.measureText(typeText).width + 30;
  drawRoundedRect(ctx, 540 - typeW / 2, 742, typeW, 32, 16);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(typeText, 540, 764);

  // 6. CÁLCULO DE ALTURAS Y DISTRIBUCIÓN VERTICAL ADAPTATIVA
  const reviewerH = emotion ? 172 : 110;
  const favH = favoriteTrackName ? 86 : 0;

  let commentLines = [];
  let commentH = 0;
  if (showComment && review?.comment) {
    ctx.font = '500 22px "Stack Sans Notch", sans-serif';
    commentLines = wrapText(ctx, review.comment, 840);
    commentH = 38 + commentLines.length * 32 + 20;
  }

  const criteriaRows = criteria.length > 3 ? 2 : criteria.length > 0 ? 1 : 0;
  const criteriaH =
    showCriteria && criteriaRows > 0
      ? criteriaRows === 2
        ? 84 * 2 + 20
        : 84
      : 0;

  // Pre-calcular distribución de filas para Tracks Destacados (Flex-wrap)
  const maxRowWidth = 952 - 48; // 904px ancho interior disponible
  const pillHeight = 42;
  const pillGapX = 12;
  const pillGapY = 10;
  const headerSectionH = 34; // Altura del título 🎵 TRACKS DESTACADOS y separación
  const trackCardPaddingY = 16;

  const trackRows = [];
  if (showTracks && topTracksList.length > 0) {
    ctx.font = '700 16px "Stack Sans Notch", sans-serif';
    let currentRow = [];
    let currentRowW = 0;

    for (let i = 0; i < topTracksList.length; i++) {
      const t = topTracksList[i];
      const scoreW = ctx.measureText(' ' + t.score).width;
      const maxAllowedNameW = maxRowWidth - scoreW - 32;

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
      const pillW = nameW + scoreW + 30;

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
    showTracks && trackRows.length > 0
      ? trackCardPaddingY * 2 +
        headerSectionH +
        trackRows.length * pillHeight +
        (trackRows.length - 1) * pillGapY
      : 0;

  const contentCards = [];
  contentCards.push({ id: 'reviewer', h: reviewerH });
  if (favH > 0) contentCards.push({ id: 'fav', h: favH });
  if (commentH > 0) contentCards.push({ id: 'comment', h: commentH });
  if (criteriaH > 0) contentCards.push({ id: 'criteria', h: criteriaH });
  if (tracksH > 0) contentCards.push({ id: 'tracks', h: tracksH });

  const startAreaY = 770;
  const endAreaY = 1770;
  const totalAvailable = endAreaY - startAreaY;
  const totalCardsH = contentCards.reduce((acc, c) => acc + c.h, 0);
  const cardCount = contentCards.length;
  const numGaps = Math.max(1, cardCount - 1);

  // Espacio libre y gap adaptativo responsivo
  const availableForGaps = totalAvailable - totalCardsH;
  const idealGap = Math.max(
    10,
    Math.min(28, availableForGaps / (cardCount + 1))
  );
  const totalGapsH = idealGap * numGaps;
  const topPadding = Math.max(
    0,
    (totalAvailable - (totalCardsH + totalGapsH)) / 2
  );
  const gap = idealGap;

  let curY = startAreaY + topPadding;

  // 7. RENDERIZADO DE LAS TARJETAS DINÁMICAS
  for (const card of contentCards) {
    if (card.id === 'reviewer') {
      // Tarjeta de Crítico y Calificación
      drawRoundedRect(ctx, 64, curY, 952, reviewerH, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Avatar del crítico
      ctx.save();
      ctx.beginPath();
      ctx.arc(122, curY + 54, 34, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.clip();
      if (avatarImg) {
        ctx.drawImage(avatarImg, 122 - 34, curY + 54 - 34, 68, 68);
      } else {
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(122 - 34, curY + 54 - 34, 68, 68);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 30px "Stack Sans Notch", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((reviewerName[0] || 'M').toUpperCase(), 122, curY + 64);
      }
      ctx.restore();

      // Nombre y Rango del crítico
      ctx.textAlign = 'left';
      ctx.font = '800 26px "Stack Sans Notch", -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      let rNameToDraw = reviewerName;
      if (ctx.measureText(rNameToDraw).width > 450) {
        while (
          rNameToDraw.length > 5 &&
          ctx.measureText(rNameToDraw + '…').width > 450
        ) {
          rNameToDraw = rNameToDraw.slice(0, -1);
        }
        rNameToDraw += '…';
      }
      ctx.fillText(rNameToDraw, 174, curY + 49);

      ctx.font = '600 18px "Stack Sans Notch", -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillText('Crítico de Musiclub', 174, curY + 77);

      // Píldora de Calificación General
      const pillW = 196;
      const pillH = 66;
      const pillX = 1080 - 64 - 20 - pillW;
      const pillY = curY + 21;
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

      ctx.fillStyle = theme.scoreTextColor;
      ctx.font = '900 34px "Stack Sans Notch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`★ ${finalScore} /10`, pillX + pillW / 2, pillY + 45);

      // Divisor y Mood
      if (emotion) {
        ctx.beginPath();
        ctx.moveTo(88, curY + 110);
        ctx.lineTo(1080 - 88, curY + 110);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '800 20px "Stack Sans Notch", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(
          `${emotion.emoji || '🎵'} ${emotion.label}`,
          92,
          curY + 146
        );

        if (emotion.desc) {
          ctx.textAlign = 'right';
          ctx.font = '500 17px "Stack Sans Notch", sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          let descToDraw = emotion.desc;
          if (ctx.measureText(descToDraw).width > 480) {
            while (
              descToDraw.length > 5 &&
              ctx.measureText(descToDraw + '…').width > 480
            ) {
              descToDraw = descToDraw.slice(0, -1);
            }
            descToDraw += '…';
          }
          ctx.fillText(descToDraw, 1080 - 92, curY + 146);
        }
      }

      curY += reviewerH + gap;
    } else if (card.id === 'fav') {
      // Tarjeta de Canción Favorita
      drawRoundedRect(ctx, 64, curY, 952, favH, 20);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      drawRoundedRect(ctx, 84, curY + 19, 48, 48, 14);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('⭐', 84 + 24, curY + 51);

      ctx.textAlign = 'left';
      ctx.font = '800 14px "Stack Sans Notch", sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('CANCIÓN FAVORITA', 148, curY + 38);

      ctx.font = '800 26px "Stack Sans Notch", sans-serif';
      ctx.fillStyle = '#fef08a';
      let favToDraw = favoriteTrackName;
      if (ctx.measureText(favToDraw).width > 760) {
        while (
          favToDraw.length > 5 &&
          ctx.measureText(favToDraw + '…').width > 760
        ) {
          favToDraw = favToDraw.slice(0, -1);
        }
        favToDraw += '…';
      }
      ctx.fillText(favToDraw, 148, curY + 67);

      curY += favH + gap;
    } else if (card.id === 'comment') {
      // Tarjeta de Comentario / Reseña
      drawRoundedRect(ctx, 64, curY, 952, commentH, 20);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '900 32px "Stack Sans Notch", sans-serif';
      ctx.fillStyle = theme.accentColor;
      ctx.fillText('“', 88, curY + 44);

      ctx.font = '500 22px "Stack Sans Notch", -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      for (let i = 0; i < commentLines.length; i++) {
        ctx.fillText(commentLines[i], 118, curY + 44 + i * 32);
      }

      curY += commentH + gap;
    } else if (card.id === 'criteria') {
      // Tarjetas de Criterios (2x3)
      const boxW = 304;
      const boxH = 84;
      const gapX = 20;
      const gapY = 20;

      for (let idx = 0; idx < criteria.length; idx++) {
        const c = criteria[idx];
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const bx = 64 + col * (boxW + gapX);
        const by = curY + row * (boxH + gapY);

        drawRoundedRect(ctx, bx, by, boxW, boxH, 18);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '700 15px "Stack Sans Notch", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fillText(`${c.icon} ${c.label}`, bx + boxW / 2, by + 34);

        ctx.font = '900 26px "Stack Sans Notch", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(c.val, bx + boxW / 2, by + 66);
      }

      curY += criteriaH + gap;
    } else if (card.id === 'tracks') {
      // Tarjeta de Canciones Destacadas con envoltura dinámica en filas (Flex-Wrap)
      drawRoundedRect(ctx, 64, curY, 952, tracksH, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Título de la sección
      ctx.textAlign = 'left';
      ctx.font = '800 15px "Stack Sans Notch", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText('🎵 TRACKS DESTACADOS:', 88, curY + 34);

      // Renderizar filas de canciones
      let pillRowY = curY + trackCardPaddingY + headerSectionH;
      for (let r = 0; r < trackRows.length; r++) {
        const row = trackRows[r];
        let pillX = 88;
        for (let c = 0; c < row.length; c++) {
          const item = row[c];
          drawRoundedRect(ctx, pillX, pillRowY, item.pillW, pillHeight, 12);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.font = '700 16px "Stack Sans Notch", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.displayName, pillX + 14, pillRowY + 26);

          ctx.fillStyle = '#fde047';
          ctx.fillText(item.score, pillX + 14 + item.nameW + 4, pillRowY + 26);

          pillX += item.pillW + pillGapX;
        }
        pillRowY += pillHeight + pillGapY;
      }

      curY += tracksH + gap;
    }
  }

  // 8. FOOTER FIJO (y: 1800 a 1880)
  ctx.beginPath();
  ctx.moveTo(64, 1800);
  ctx.lineTo(1080 - 64, 1800);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (logoImg) {
    ctx.drawImage(logoImg, 64, 1822, 44, 44);
  }

  ctx.textAlign = 'left';
  ctx.font = '900 24px "Stack Sans Notch", -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Musiclub', 124, 1853);

  ctx.font = '300 20px "Stack Sans Notch", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('|', 254, 1853);

  ctx.font = '600 18px "Stack Sans Notch", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('Comunidad de Crítica Musical', 274, 1853);

  // Píldora #Musiclub
  const tagText = '#Musiclub';
  ctx.font = '800 18px "Stack Sans Notch", sans-serif';
  const tagW = ctx.measureText(tagText).width + 36;
  const tagX = 1080 - 64 - tagW;
  drawRoundedRect(ctx, tagX, 1822, tagW, 44, 22);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tagText, tagX + tagW / 2, 1850);

  return canvas;
}

// =========================================================================
// COMPONENTE PRINCIPAL: SHARE REVIEW MODAL
// =========================================================================
export function ShareReviewModal({
  isOpen,
  onClose,
  review,
  album: rawAlbum,
  currentUser = null,
}) {
  const [selectedThemeId, setSelectedThemeId] = useState('neon');
  const [showVinylDisc, setShowVinylDisc] = useState(true);
  const [showComment, setShowComment] = useState(true);
  const [showCriteria, setShowCriteria] = useState(true);
  const [showTracks, setShowTracks] = useState(true);

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

  // Calificación final
  const finalScore = useMemo(() => {
    if (!review) return '10.0';
    const s = getWeightedReviewScore(review) ?? review.rating_general;
    if (s !== null && s !== undefined && !isNaN(Number(s))) {
      return Number(s).toFixed(1);
    }
    return '10.0';
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

  // Criterios disponibles
  const criteriaList = useMemo(() => {
    if (!review) return [];
    return [
      { label: 'Producción', icon: '🎛️', val: review.rating_produccion },
      { label: 'Composición', icon: '🎵', val: review.rating_composicion },
      { label: 'Letras', icon: '📝', val: review.rating_letras },
      { label: 'Originalidad', icon: '💡', val: review.rating_originalidad },
      { label: 'Cohesión', icon: '🔗', val: review.rating_cohesion },
      { label: 'Replay Value', icon: '🔄', val: review.rating_replay },
    ].filter((c) => c.val !== undefined && c.val !== null);
  }, [review]);

  // Top tracks calificados
  const topTracksList = useMemo(() => {
    const trMap = review?.track_ratings || review?.trackRatings;
    if (!trMap || typeof trMap !== 'object') return [];
    return Object.entries(trMap)
      .map(([k, score]) => ({
        key: k,
        name: getTrackDisplayName(k, album?.tracks),
        score: Number(score),
      }))
      .filter((t) => !isNaN(t.score) && t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [review, album]);

  // URL del álbum
  const albumUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://musiclub.org';
    const relUrl = album
      ? getReleaseUrl(album.album_name, album.release_type)
      : '/';
    return `${origin}${relUrl}`;
  }, [album]);

  // Notificación toast
  const showToast = useCallback((msg, duration = 3500) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  }, []);

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
          showVinylDisc,
          showComment,
          showCriteria,
          showTracks,
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
  }, [
    isOpen,
    review,
    rawAlbum,
    currentUser,
    selectedThemeId,
    showVinylDisc,
    showComment,
    showCriteria,
    showTracks,
    album,
  ]);

  // Descargar imagen HD (PNG 9:16)
  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true);
      showToast('📸 Generando Story en alta definición (9:16)...', 2000);

      const canvas = await generateReviewStoryCanvas({
        review,
        album: rawAlbum,
        currentUser,
        themeId: selectedThemeId,
        showVinylDisc,
        showComment,
        showCriteria,
        showTracks,
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

      showToast('✅ ¡Story descargada en tu dispositivo! Lista para publicar.');
    } catch (err) {
      console.error('Error generando imagen:', err);
      showToast('⚠️ No se pudo generar la imagen. Intenta nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar imagen al portapapeles
  const handleCopyImage = async () => {
    try {
      setIsGenerating(true);
      showToast('📋 Copiando imagen al portapapeles...');

      const canvas = await generateReviewStoryCanvas({
        review,
        album: rawAlbum,
        currentUser,
        themeId: selectedThemeId,
        showVinylDisc,
        showComment,
        showCriteria,
        showTracks,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Blob nulo al exportar canvas');
        }
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            showToast(
              '✅ ¡Imagen copiada! Puedes pegarla en tus chats o apps.'
            );
          } else {
            handleDownloadImage();
          }
        } catch (clipErr) {
          console.warn(
            'Clipboard write falló, descargando en su lugar:',
            clipErr
          );
          handleDownloadImage();
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error al copiar imagen:', err);
      showToast(
        '⚠️ No se pudo copiar la imagen al portapapeles. Descargando...'
      );
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
            showVinylDisc,
            showComment,
            showCriteria,
            showTracks,
          });
          const blob = await new Promise((res) =>
            canvas.toBlob(res, 'image/png')
          );
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
          console.warn(
            'Compartir archivo nativo omitido, usando enlace:',
            fileShareErr
          );
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
        showToast(
          '📋 Texto y link copiados + imagen descargada para tus redes.'
        );
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
      return `Mi review de "${albumTitle}" de ${artist} 🎵 Calificación: ${finalScore}/10 ${moodStr} #Musiclub #AlbumReview #Musica #Review #VinylTok`;
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
        showToast(
          '📸 ¡Story 9:16 descargada y texto copiado! Ábrela en tus Stories de Instagram.'
        );
        break;
      }

      case 'tiktok': {
        await handleDownloadImage();
        try {
          await navigator.clipboard.writeText(caption);
        } catch (_) {}
        showToast('🎵 ¡Story descargada y hashtags copiados para TikTok!');
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
        showToast(
          '👻 ¡Imagen 9:16 descargada! Lista para subir a tu Snap Story.'
        );
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
      showToast('🔗 ¡Enlace del álbum copiado al portapapeles!');
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <ShareIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm sm:text-base leading-tight">
                Compartir Review en Redes Sociales
              </h3>
              <p className="text-white/50 text-[11px] sm:text-xs">
                Formato Celular / Stories 9:16 para Instagram, TikTok, WhatsApp
                y más
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Contenido en 2 Columnas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 custom-scrollbar">
          {/* COLUMNA IZQUIERDA: MOCKUP DE CELULAR */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="text-white/60 text-xs font-bold mb-2 flex items-center gap-1.5">
              <span>📱</span> Vista Previa Formato Story (9:16)
            </div>

            {/* Chasis de Celular */}
            <div
              className="relative rounded-[36px] bg-[#05060a] border-[7px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center justify-center flex-shrink-0"
              style={{
                width: '284px',
                height: '504px',
                boxShadow:
                  '0 0 0 2px rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.9)',
              }}
            >
              {/* Notch / Dynamic Island */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-22 h-4 bg-black rounded-full z-30 flex items-center justify-center border border-white/10 shadow-sm pointer-events-none">
                <div className="w-8 h-1 rounded-full bg-slate-800 mr-2"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
              </div>

              {/* Pantalla del Teléfono (270 x 480 px) */}
              <div
                className="overflow-hidden relative flex items-center justify-center bg-[#0a0c16]"
                style={{
                  width: '270px',
                  height: '480px',
                }}
              >
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Story Preview"
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-white/50 text-xs">
                    <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Generando vista previa...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selector de Temas Estéticos */}
            <div className="mt-4 w-full flex items-center justify-center gap-1.5 flex-wrap">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedThemeId(t.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                    selectedThemeId === t.id
                      ? 'bg-white/20 text-white border-white/40 shadow-sm scale-105'
                      : 'bg-black/30 text-white/50 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* COLUMNA DERECHA: REDES SOCIALES FAMOSAS Y ACCIONES DIRECTAS */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            {/* 1. OPCIONES DE PERSONALIZACIÓN RÁPIDA */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2.5">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider block">
                ⚙️ Ajustes de la Story:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showVinylDisc}
                    onChange={(e) => setShowVinylDisc(e.target.checked)}
                    className="accent-pink-500 rounded"
                  />
                  <span>Disco de Vinilo 3D</span>
                </label>

                {review?.comment && (
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showComment}
                      onChange={(e) => setShowComment(e.target.checked)}
                      className="accent-pink-500 rounded"
                    />
                    <span>Comentario</span>
                  </label>
                )}

                {criteriaList.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showCriteria}
                      onChange={(e) => setShowCriteria(e.target.checked)}
                      className="accent-pink-500 rounded"
                    />
                    <span>6 Pilares de Crítica</span>
                  </label>
                )}

                {topTracksList.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showTracks}
                      onChange={(e) => setShowTracks(e.target.checked)}
                      className="accent-pink-500 rounded"
                    />
                    <span>Canciones Calificadas</span>
                  </label>
                )}
              </div>
            </div>

            {/* 2. BOTONES DE ACCIÓN PRINCIPAL (WEB SHARE + DESCARGA DIRECTA) */}
            <div className="space-y-2.5">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider block">
                ⚡ Acciones Rápidas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleNativeShare}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Compartir directo a través del menú de tu teléfono o navegador"
                >
                  <ShareIcon className="w-4 h-4 text-white flex-shrink-0" />
                  <span>Compartir Nativo</span>
                </button>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleDownloadImage}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Descargar imagen en alta definición 1080x1920 (PNG 9:16)"
                >
                  <DownloadIcon className="w-4 h-4 text-white flex-shrink-0" />
                  <span>Descargar Story HD</span>
                </button>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleCopyImage}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/15 text-white/90 hover:text-white font-bold text-xs sm:text-sm border border-white/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Copiar imagen al portapapeles para pegarla en chats o apps"
                >
                  <CopyImageIcon className="w-4 h-4 text-white flex-shrink-0" />
                  <span>Copiar Imagen</span>
                </button>
              </div>
            </div>

            {/* 3. REDES SOCIALES FAMOSAS CON LOGOS OFICIALES */}
            <div className="space-y-2.5">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider block">
                🌐 Compartir en tus Redes:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Instagram */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleShareToPlatform('instagram')}
                  className="p-2 rounded-xl bg-gradient-to-r from-purple-600/25 via-pink-600/25 to-orange-500/25 hover:from-purple-600/40 hover:to-orange-500/40 border border-pink-500/30 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <InstagramIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      Instagram
                    </div>
                    <div className="text-[10px] text-pink-300">
                      Story & Feed
                    </div>
                  </div>
                </button>

                {/* TikTok */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleShareToPlatform('tiktok')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-black border border-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <TikTokIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      TikTok
                    </div>
                    <div className="text-[10px] text-cyan-300">
                      Formato 9:16
                    </div>
                  </div>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('whatsapp')}
                  className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#25D366] flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <WhatsAppIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      WhatsApp
                    </div>
                    <div className="text-[10px] text-emerald-300">
                      Chats & Estados
                    </div>
                  </div>
                </button>

                {/* X / Twitter */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('twitter')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-black border border-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <XTwitterIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      X (Twitter)
                    </div>
                    <div className="text-[10px] text-white/50">
                      Post directo
                    </div>
                  </div>
                </button>

                {/* Threads */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('threads')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-black border border-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <ThreadsIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      Threads
                    </div>
                    <div className="text-[10px] text-white/50">
                      Compartir hilo
                    </div>
                  </div>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('facebook')}
                  className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1877F2] flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <FacebookIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      Facebook
                    </div>
                    <div className="text-[10px] text-blue-300">
                      Compartir post
                    </div>
                  </div>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('telegram')}
                  className="p-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/35 border border-sky-500/30 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#229ED9] flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <TelegramIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      Telegram
                    </div>
                    <div className="text-[10px] text-sky-300">Canal / Chat</div>
                  </div>
                </button>

                {/* Reddit */}
                <button
                  type="button"
                  onClick={() => handleShareToPlatform('reddit')}
                  className="p-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/35 border border-orange-500/30 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#FF4500] flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <RedditIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      Reddit
                    </div>
                    <div className="text-[10px] text-orange-300">
                      Comunidad r/
                    </div>
                  </div>
                </button>

                {/* Snapchat */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleShareToPlatform('snapchat')}
                  className="p-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/30 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#FFFC00] flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <SnapchatIcon className="w-4 h-4 text-black" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      Snapchat
                    </div>
                    <div className="text-[10px] text-yellow-300/80">
                      Snap Story
                    </div>
                  </div>
                </button>

                {/* Copiar Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white/90 flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <LinkIcon className="w-4 h-4 text-white/90" />
                  </div>
                  <div className="text-left truncate">
                    <div className="font-bold text-white leading-tight">
                      Copiar Enlace
                    </div>
                    <div className="text-[10px] text-white/50">
                      Link de reseña
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Tip para usuarios */}
            <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl text-left flex items-center gap-2.5 text-xs text-pink-200">
              <span className="text-lg">💡</span>
              <span>
                Tip: En tu celular, pulsa <strong>Compartir Nativo</strong> para
                enviar la imagen directamente a tus{' '}
                <strong>Instagram Stories</strong> o <strong>WhatsApp</strong>{' '}
                sin necesidad de descargarla manualmente.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
