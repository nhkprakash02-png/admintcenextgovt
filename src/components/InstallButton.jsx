'use client';

import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Floating "Install App" button at the bottom right, same look as the student website's.
// It only appears when the browser says the admin app can be installed (and disappears once it
// is installed).
export default function InstallButton() {
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <button
        onClick={() => { deferred.prompt(); setDeferred(null); }}
        className="flex items-center gap-2 px-4 py-3 rounded-full btn-gold shadow-lg text-xs font-bold"
      >
        <Download className="w-4 h-4" /> 📲 Install App
      </button>
    </div>
  );
}
