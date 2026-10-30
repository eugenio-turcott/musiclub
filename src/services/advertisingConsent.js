'use client';
import { useEffect, useState } from 'react';
import preferences from '../utils/advertisingConsent.cjs';

const EVENT = 'musiclub-advertising-change';
let sessionChoice = 'unknown';
let reloading = false;

function readChoice() {
  try { return preferences.parsePreference(localStorage.getItem(preferences.KEY)); }
  catch { return sessionChoice; }
}

function stopLoadedAdvertising(choice) {
  // Reload to stop third-party timers and scripts already loaded with consent.
  if (choice !== 'accepted' && !reloading && document.getElementById('musiclub-adcash-library')) {
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
