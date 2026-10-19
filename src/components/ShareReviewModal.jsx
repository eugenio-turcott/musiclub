'use client';
import dynamic from 'next/dynamic';

const ShareReviewDialog = dynamic(() => import('./ShareReviewDialog').then(module => module.ShareReviewModal), {
  ssr: false,
  loading: () => <p role="status" className="fixed inset-x-4 top-24 z-[99999] rounded-xl bg-slate-900 p-4 text-center text-white">Preparando la tarjeta para compartir…</p>,
});

export function ShareReviewModal(props) {
  return props.isOpen ? <ShareReviewDialog {...props} /> : null;
}

export default ShareReviewModal;

export { InstagramIcon, TikTokIcon, WhatsAppIcon, XTwitterIcon, ThreadsIcon, FacebookIcon, TelegramIcon, RedditIcon, SnapchatIcon, SpotifyIcon, ShareIcon, DownloadIcon, CopyImageIcon, LinkIcon } from './common/ShareIcons';
