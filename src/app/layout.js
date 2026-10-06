import React from 'react';
import './globals.css';
import PwaAndSession from '../components/PwaAndSession';

export const metadata = {
  title: 'TCE Admin',
  description: 'TCE - The Competitive Edge · Admin',
  robots: { index: false, follow: false, nocache: true },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, title: 'TCE Admin', statusBarStyle: 'black-translucent' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0B0B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&family=Noto+Sans+Bengali:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="no-tap-highlight">
        {children}
        <PwaAndSession />
      </body>
    </html>
  );
}
