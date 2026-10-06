'use client';

import React, { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async (e) => {
    if (e) e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.reload(); // the server now sees the login cookie and renders the dashboard
        return;
      }
      setError(data.error || 'Login failed. Please try again.');
      setPassword('');
    } catch (err) {
      setError('Could not reach the server. Please check your internet connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={login} className="card rounded-2xl p-6 sm:p-8 w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="TCE" className="w-16 h-16 rounded-full object-cover mb-3" style={{ boxShadow: '0 0 28px rgba(245,158,11,0.35)' }} />
          <h1 className="font-display font-800 text-xl gold-text">TCE Admin</h1>
          <p className="text-xs muted mt-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Authorized access only</p>
        </div>
        <input
          type="email" name="email" placeholder="Admin Email" autoComplete="username" autoCapitalize="off" spellCheck="false"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm"
        />
        <input
          type="password" name="password" placeholder="Password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" disabled={busy} className="w-full btn-gold rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {busy ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </main>
  );
}
