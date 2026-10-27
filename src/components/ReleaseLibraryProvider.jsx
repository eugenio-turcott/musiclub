'use client';
import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { supabase } from '../services/supabaseClient';
import { createReleaseLibraryStore } from '../services/releaseLibraryStore.mjs';
import { LoginModal } from './LoginModal';

const Context = createContext(null);

export function ReleaseLibraryProvider({ children }) {
  const [store] = useState(() => createReleaseLibraryStore(supabase));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const channel = useRef(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  useEffect(() => {
    let active = true, receivedAuth = false, account;
    const sync = session => {
      const next = session?.user?.id || null;
      if (!active || account === next) return;
      account = next;
      setShowLogin(false);
      void store.setAccount(next).catch(() => {});
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuth = true;
      // Do not issue another Supabase request inside its auth callback lock.
      queueMicrotask(() => sync(session));
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!receivedAuth && active) sync(error ? null : data.session);
    }).catch(() => { if (!receivedAuth && active) sync(null); });
    const refresh = () => { if (store.getSnapshot().account && !store.getSnapshot().pending.length) void store.refresh().catch(() => {}); };
    window.addEventListener('focus', refresh);
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel('musiclub-release-library');
      channel.current.onmessage = event => { if (event.data?.account === store.getSnapshot().account) refresh(); };
    }
    return () => { active = false; subscription.unsubscribe(); window.removeEventListener('focus', refresh); channel.current?.close(); channel.current = null; };
  }, [store]);
  const value = useMemo(() => ({ ...snapshot,
    refresh: store.refresh,
    requireLogin: () => setShowLogin(true),
    setPreference: async (...args) => {
      const result = await store.setPreference(...args);
      if (result) channel.current?.postMessage({ account: store.getSnapshot().account });
      return result;
    },
  }), [snapshot, store]);
  return <Context.Provider value={value}>
    {children}
    <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} zIndex={10000010} loading={loginBusy} onLogin={async () => {
      setLoginBusy(true);
      try {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}` } });
        return error ? { success: false, error: error.message } : { success: true, redirecting: true };
      } finally { setLoginBusy(false); }
    }} />
  </Context.Provider>;
}

export function useReleaseLibrary() {
  const value = useContext(Context);
  if (!value) throw new Error('ReleaseLibraryProvider is required');
  return value;
}
