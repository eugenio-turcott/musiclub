'use client';
import { useEffect, useState } from 'react';
import preferences from '../utils/advertisingConsent.cjs';
import policy from '../utils/advertisingPolicy.cjs';

const EVENT = 'musiclub-advertising-change';
let sessionChoice = 'unknown';
let reloading = false;
let resolvedMode;
let policyRequest;

function loadPolicy() {
  if (!policyRequest) policyRequest = fetch('/api/advertising/policy', {cache:'no-store',credentials:'omit'})
    .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json(); })
    .then(value => value.mode === 'automatic' ? 'automatic' : 'consent')
    .catch(() => 'consent')
    .then(value => { resolvedMode = value; return value; });
  return policyRequest;
}

function readChoice() {
  try { return preferences.parsePreference(localStorage.getItem(preferences.KEY)); }
  catch { return sessionChoice; }
}

function stopLoadedAdvertising(choice) {
  // Reload to stop third-party timers and scripts already loaded with consent.
  const blocked = navigator.globalPrivacyControl === true || choice === 'rejected' ||
    (choice !== 'accepted' && resolvedMode !== 'automatic');
  if (blocked && !reloading && document.getElementById('musiclub-adcash-library')) {
    reloading = true;
    window.location.reload();
  }
}

export function setAdvertisingChoice(choice) {
  if (!['accepted', 'rejected'].includes(choice)) return;
  sessionChoice = choice;
  try { localStorage.setItem(preferences.KEY, JSON.stringify({choice, savedAt: Date.now()})); } catch {}
  window.dispatchEvent(new Event(EVENT));
  stopLoadedAdvertising(choice);
}

export function useAdvertisingChoice() {
  const [choice, setChoice] = useState('unknown');
  useEffect(() => {
    const update = () => { const value = readChoice(); setChoice(value); stopLoadedAdvertising(value); };
    const storage = event => { if (event.key === preferences.KEY || event.key === null) update(); };
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener('storage', storage);
    return () => { window.removeEventListener(EVENT, update); window.removeEventListener('storage', storage); };
  }, []);
  return choice;
}

export function useAdvertisingPermission() {
  const choice = useAdvertisingChoice();
  const [mode, setMode] = useState('pending');
  const [privacySignal, setPrivacySignal] = useState(true);
  useEffect(() => {
    let active = true;
    setPrivacySignal(navigator.globalPrivacyControl === true);
    loadPolicy().then(value => { if (active) setMode(value); });
    return () => { active = false; };
  }, []);
  return {choice, mode, privacySignal, allowed:policy.mayLoadAdvertising(choice,mode,privacySignal)};
}
