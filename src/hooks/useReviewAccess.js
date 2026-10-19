import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export function useReviewAccess(albumId) {
  const stored = /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(String(albumId || ''));
  const [access, setAccess] = useState({ id: null, allowed: null });
  useEffect(() => {
    if (!stored) return;
    let alive = true;
    const refresh = async () => {
      try {
        const { data, error } = await supabase.rpc('musiclub_can_review_album', { p_album_id: albumId });
        if (alive) setAccess({ id: albumId, allowed: !error && data === true });
      } catch {
        if (alive) setAccess({ id: albumId, allowed: false });
      }
    };
    refresh();
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { alive = false; window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [albumId, stored]);
  return !stored ? true : access.id === albumId ? access.allowed : null;
}
