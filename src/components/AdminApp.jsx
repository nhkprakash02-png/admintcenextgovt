'use client';

import React, { useState } from 'react';
import { ClipboardList, Users, FileUp, Brain, BookOpen, GraduationCap, Megaphone, Settings, LogOut, Loader2 } from 'lucide-react';
import { AppProvider, useApp } from '../context/AppContext';
import { signOut } from 'firebase/auth';
import { fbAuth } from '../firebase';
import MockManager from './admin/MockManager';
import PendingApprovals from './admin/PendingApprovals';
import StudentsManager from './admin/StudentsManager';
import FeesManager from './admin/FeesManager';
import ResultsManager from './admin/ResultsManager';
import PyqManager from './admin/PyqManager';
import GkQuizManager from './admin/GkQuizManager';
import MaterialsManager from './admin/MaterialsManager';
import BatchesManager from './admin/BatchesManager';
import BannersManager from './admin/BannersManager';
import UrgentNoticesManager from './admin/UrgentNoticesManager';
import NoticesManager from './admin/NoticesManager';
import SettingsManager from './admin/SettingsManager';

// Every screen below is the SAME component the old Admin Panel used — only the way they are
// arranged on the page is new.
const STUDENT_SUBTABS = [
  ['pending', 'Pending Approvals', PendingApprovals],
  ['list', 'Students List', StudentsManager],
  ['fees', 'Monthly Fees', FeesManager],
  ['results', 'Mock Results', ResultsManager],
];
const UPDATE_SUBTABS = [
  ['banners', 'Banner Slider', BannersManager],
  ['urgent', 'Urgent Notice', UrgentNoticesManager],
  ['notices', 'Notices', NoticesManager],
];

// [id, label, icon, component (single screen) | null, sub-tabs | null]
const TABS = [
  ['mock', 'Mock Manager', ClipboardList, MockManager, null],
  ['students', 'Students', Users, null, STUDENT_SUBTABS],
  ['pyq', 'PYQ Uploader', FileUp, PyqManager, null],
  ['gk', 'GK Quiz', Brain, GkQuizManager, null],
  ['materials', 'Materials', BookOpen, MaterialsManager, null],
  ['batches', 'Batches', GraduationCap, BatchesManager, null],
  ['updates', 'Updates', Megaphone, null, UPDATE_SUBTABS],
  ['settings', 'Settings', Settings, SettingsManager, null],
];

function Dashboard() {
  const { dbLoading, loadError, retryLoad } = useApp();
  const [tab, setTab] = useState('mock');
  const [subTabs, setSubTabs] = useState({ students: 'pending', updates: 'banners' });
  const [loggingOut, setLoggingOut] = useState(false);

  const current = TABS.find((t) => t[0] === tab) || TABS[0];
  const subList = current[4];
  const activeSub = subList ? (subList.find((s) => s[0] === subTabs[tab]) || subList[0]) : null;
  const Active = subList ? activeSub[2] : current[3];

  const logout = async () => {
    setLoggingOut(true);
    try { if (fbAuth) await signOut(fbAuth); } catch (e) { /* ignore */ }
    try { await fetch('/api/logout', { method: 'POST' }); } catch (e) { /* the reload below still shows the login screen if the cookie is gone */ }
    window.location.reload();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30" style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="TCE" className="w-9 h-9 rounded-full object-cover shrink-0" />
            <div className="min-w-0">
              <h1 className="font-display font-800 leading-tight gold-text truncate">TCE Admin</h1>
              <p className="text-[11px] muted leading-tight truncate">The Competitive Edge · Control Panel</p>
            </div>
          </div>
          <button onClick={logout} disabled={loggingOut} className="btn-ghost rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-60">
            {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />} Logout
          </button>
        </div>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto hide-scrollbar" aria-label="Admin sections">
          {TABS.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2.5 rounded-t-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${tab === id ? 'tab-active' : 'muted'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </nav>
      </header>

      {subList && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 flex gap-2 overflow-x-auto hide-scrollbar">
          {subList.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSubTabs((s) => ({ ...s, [tab]: id }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${activeSub[0] === id ? 'gold-grad text-ink border-transparent' : 'muted'}`}
              style={activeSub[0] === id ? undefined : { borderColor: 'var(--border)' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {dbLoading ? (
          <div className="flex flex-col items-center justify-center py-24 muted text-sm gap-3">
            <Loader2 className="w-6 h-6 animate-spin" /> Loading data…
          </div>
        ) : loadError ? (
          <div className="card rounded-xl p-6 text-center">
            <p className="text-sm text-red-400 mb-3">Could not load the data: {loadError}</p>
            <button onClick={retryLoad} className="btn-gold rounded-lg px-4 py-2 text-xs font-bold">Try again</button>
          </div>
        ) : (
          <Active key={tab + (activeSub ? activeSub[0] : '')} />
        )}
      </main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
