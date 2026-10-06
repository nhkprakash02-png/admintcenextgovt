'use client';

// The admin screens were written against the student site's AppContext and only ever use four
// things from it: DB, saveDB, banners and setBanners (plus setDB/dbLoading here for the shell).
// This file provides exactly those with the SAME logic as the student site — load everything
// from Firestore once, keep it live with the same realtime listeners, and write changes back with
// the same saveDB — so every admin screen works unchanged. All the student-only parts (student
// login, routing, exams, payments, theme) are intentionally not here.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadDB, saveDB as persistDB, attachDbRealtimeListeners, loadBanners } from '../lib/db';
import { emptyDB } from '../lib/seedData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [DB, setDB] = useState(emptyDB);
  const [dbLoading, setDbLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [banners, setBanners] = useState([]);
  const [attempt, setAttempt] = useState(0); // bump to retry loading after a failure

  // Boot: load DB + banners from Firestore.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError('');
        setDbLoading(true);
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

  // Same single-subscription realtime listener setup as the student site (subscribed once; the
  // ref lets it read the latest DB without re-subscribing — see the note in lib/db.js).
  const dbRef = useRef(DB);
  useEffect(() => { dbRef.current = DB; }, [DB]);
  useEffect(() => {
    const unsub = attachDbRealtimeListeners(() => dbRef.current, (key, incoming) => {
      setDB((prev) => ({ ...prev, [key]: incoming }));
    });
    return unsub;
  }, []);

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
