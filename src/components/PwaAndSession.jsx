'use client';

import { useEffect } from 'react';

// Renders nothing (no visible UI). It does two background jobs:
//  1. registers the tiny service worker so the admin app can be installed on phones/computers;
//  2. renews the login cookie each time the app is opened or returns to the foreground, so the
//     admin stays logged in until Logout is pressed.
const RENEW_EVERY_MS = 30 * 60 * 1000;

export default function PwaAndSession() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('Service worker not registered', e));
    }
    let last = 0;
    const renew = () => {
      const now = Date.now();
      if (now - last < RENEW_EVERY_MS) return;
      last = now;
      fetch('/api/session', { method: 'POST', credentials: 'same-origin' }).catch(() => { last = 0; });
    };
    renew();
    const onVisible = () => { if (document.visibilityState === 'visible') renew(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
  return null;
}
