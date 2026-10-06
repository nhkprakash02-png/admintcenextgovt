import React from 'react';
import './globals.css';

export const metadata = {
  title: 'TCE Admin',
  description: 'TCE - The Competitive Edge · Admin',
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/logo.png', apple: '/logo.png' },
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
      <body className="no-tap-highlight">{children}</body>
    </html>
  );
}
