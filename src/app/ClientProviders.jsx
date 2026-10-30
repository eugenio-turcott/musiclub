'use client';

import React, { useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../utils/translateCrashGuard';
import { SiteMetrics } from '../components/SiteMetrics';
import { ReleaseLibraryProvider } from '../components/ReleaseLibraryProvider';
import {usePathname} from 'next/navigation';
import advertisingPolicy from '../utils/advertisingPolicy.cjs';

export function ClientProviders({ children }) {
  const pathname = usePathname();
  useEffect(() => {
    // Stop third-party code and its timers when leaving public content.
    // Removing a script tag alone would not stop an already running library.
    if(pathname && !advertisingPolicy.publicAdvertisingPath(pathname) && document.getElementById('musiclub-adcash-library')) {
      window.location.reload();
    }
  }, [pathname]);
  useEffect(() => {
    // Client hostname redirect safety check
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (
        hostname === 'musiclub-albums.vercel.app' ||
        hostname === 'musiclub.org'
      ) {
        window.location.replace(
          'https://www.musiclub.org' +
            window.location.pathname +
            window.location.search +
            window.location.hash
        );
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <div
        id="google_translate_element"
        style={{
          position: 'absolute',
          left: -9999,
          top: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      />
      <ReleaseLibraryProvider>{children}</ReleaseLibraryProvider>
      <SiteMetrics />
    </ErrorBoundary>
  );
}
