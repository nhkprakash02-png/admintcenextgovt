'use client';

// The admin screens only ever use DB, saveDB, banners and setBanners from the app context.
// This file provides them with the same logic as the student site: sign in to Firebase as the
// admin, load everything from Firestore once, keep it live with the same realtime listeners, and
// write changes back with the same saveDB.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadDB, saveDB as persistDB, attachDbRealtimeListeners, loadBanners } from '../lib/db';
import { emptyDB } from '../lib/seedData';
import { ensureFirebaseSignIn } from '../lib/firebaseAdminSignIn';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [DB, setDB] = useState(emptyDB);
  const [dbLoading, setDbLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [banners, setBanners] = useState([]);
  const [attempt, setAttempt] = useState(0); // bump to retry loading after a failure
  const [authReady, setAuthReady] = useState(false);

  // Boot: sign in to Firebase, then load DB + banners from Firestore.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError('');
        setDbLoading(true);
        await ensureFirebaseSignIn();
        if (cancelled) return;
        setAuthReady(true);
        const loaded = await loadDB();
        if (cancelled) return;
        setDB(loaded);
        setDbLoading(false);
        const b = await loadBanners(loaded);
        if (!cancelled) setBanners(b);
      } catch (e) {
        console.error('Admin: failed to load data', e);
        if (!cancelled) { setLoadError((e && e.message) || 'Could not load data from Firestore.'); setDbLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  // Same single-subscription realtime listener setup as the student site, started only after the
  // admin is signed in (listeners that start too early are rejected and never recover).
  const dbRef = useRef(DB);
  useEffect(() => { dbRef.current = DB; }, [DB]);
  useEffect(() => {
    if (!authReady) return undefined;
    const unsub = attachDbRealtimeListeners(() => dbRef.current, (key, incoming) => {
      setDB((prev) => ({ ...prev, [key]: incoming }));
    });
    return unsub;
  }, [authReady]);

  // Identical to the student site's saveDB: update the screen immediately, sync to Firestore.
  const saveDB = useCallback((updater) => {
    setDB((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistDB(next);
      return next;
    });
  }, []);

  const retryLoad = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo(() => ({
    DB, setDB, saveDB, dbLoading, loadError, retryLoad, banners, setBanners,
  }), [DB, saveDB, dbLoading, loadError, retryLoad, banners]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
