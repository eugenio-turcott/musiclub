import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export function usePoolReviewGate(albumId, userId) {
  const stored = /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(String(albumId || ''));
  const key = `${albumId || ''}:${userId || ''}`;
  const current = useRef(key);
  current.current = key;
  const sequence = useRef(0);
  const [state, setState] = useState({ key: null, data: null, error: '' });
  const refresh = useCallback(async () => {
    if (!stored) return;
    const request = ++sequence.current;
    try {
      const { data, error } = await supabase.rpc('musiclub_review_context', { p_album_id: albumId });
      if (error || typeof data?.allowed !== 'boolean') throw new Error('No se pudo comprobar el acceso a las reseñas.');
      if (current.current === key && request === sequence.current) setState({ key, data, error: '' });
    } catch {
      if (current.current === key && request === sequence.current) setState({ key, data: null, error: 'No se pudo comprobar el acceso a las reseñas. Inténtalo de nuevo.' });
    }
  }, [albumId, key, stored]);
  useEffect(() => {
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('musiclub:review-access-change', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { ++sequence.current; window.removeEventListener('focus', refresh); window.removeEventListener('musiclub:review-access-change', refresh); window.clearInterval(timer); };
  }, [refresh]);
  const data = !stored ? { allowed: true, catalog_allowed: true, requires_confirmation: false, pools: [] } : state.key === key ? state.data : null;
  const confirm = async () => {
    const expected = (data?.pools || []).filter(pool => pool.blocked).map(pool => ({ entry_id: pool.entry_id, version: pool.version }));
    const { data: next, error } = await supabase.rpc('musiclub_confirm_pool_review', { p_album_id: albumId, p_expected: expected });
    if (current.current !== key) throw new Error('Tu sesión cambió. Vuelve a abrir la reseña.');
    if (error || next?.allowed !== true) { await refresh(); throw new Error(error?.message || 'El Pool cambió. Revisa la fecha y confirma de nuevo.'); }
    ++sequence.current;
    setState({ key, data: next, error: '' });
    window.dispatchEvent(new Event('musiclub:review-access-change'));
  };
  return { ...data, allowed: data?.allowed ?? null, error: state.key === key ? state.error : '', refresh, confirm };
}
