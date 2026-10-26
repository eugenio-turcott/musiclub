import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export function useReviewAccess(albumId, userId) {
  const stored = /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(String(albumId || ''));
  const key = `${albumId || ''}:${userId || ''}`;
  const [access, setAccess] = useState({ id: null, allowed: null });
  useEffect(() => {
    if (!stored) return;
    let alive = true;
    const refresh = async () => {
      try {
        const { data, error } = await supabase.rpc('musiclub_can_review_album', { p_album_id: albumId });
        if (alive) setAccess({ id: key, allowed: !error && data === true });
      } catch {
        if (alive) setAccess({ id: key, allowed: false });
      }
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('musiclub:review-access-change', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { alive = false; window.removeEventListener('focus', refresh); window.removeEventListener('musiclub:review-access-change', refresh); window.clearInterval(timer); };
  }, [albumId, stored, key]);
  return !stored ? true : access.id === key ? access.allowed : null;
}
