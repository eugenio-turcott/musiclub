'use client';
import React, { forwardRef, useState, useEffect, useMemo } from 'react';
import NextLink from 'next/link';
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
} from 'next/navigation';

const preparedRoutes = new Map();

/**
 * Universal Link component compatible with both React Router ('to' prop)
 * and Next.js ('href' prop).
 */
export const Link = forwardRef(function Link(
  { to, href, replace, children, onClick, state, onMouseEnter, onFocus, intentPrefetch = true, ...props },
  ref
) {
  const target = href || to || '#';
  const router = useRouter();
  const prepare = () => {
    if (!intentPrefetch || typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) return;
    if (navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || '')) return;
    const path = target.split('#')[0];
    if (!path || path === window.location.pathname + window.location.search) return;
    const now = Date.now();
    if (now - (preparedRoutes.get(path) || 0) < 30000) return;
    if (preparedRoutes.size >= 24) preparedRoutes.delete(preparedRoutes.keys().next().value);
    preparedRoutes.set(path, now);
    router.prefetch(path);
  };
  return (
    <NextLink ref={ref} href={target} replace={replace} prefetch={false} {...props} onMouseEnter={event=>{onMouseEnter?.(event);if(!event.defaultPrevented)prepare();}} onFocus={event=>{onFocus?.(event);if(!event.defaultPrevented)prepare();}} onClick={event => {
      onClick?.(event);
      if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && typeof target === 'string') {
        window.dispatchEvent(new CustomEvent('musiclub:navigate', { detail: target }));
      }
    }}>
      {children}
    </NextLink>
  );
});

Link.displayName = 'Link';

/**
 * Emulates react-router-dom useNavigate() using Next.js useRouter()
 */
export function useNavigate() {
  const router = useRouter();
  const currentPathname = usePathname();
  return (destination, options) => {
    if (typeof destination === 'number') {
      if (destination < 0) {
        router.back();
      } else {
        router.forward();
      }
      return;
    }

    let target = destination;
    if (typeof destination === 'object' && destination !== null) {
      const p = destination.pathname || currentPathname || '/';
      const s = destination.search
        ? destination.search.startsWith('?')
          ? destination.search
          : `?${destination.search}`
        : '';
      const h = destination.hash
        ? destination.hash.startsWith('#')
          ? destination.hash
          : `#${destination.hash}`
        : '';
      target = `${p}${s}${h}`;
    }

    if (typeof target !== 'string') {
      target = String(target || '/');
    }

    if (options?.replace) {
      router.replace(target);
    } else {
      router.push(target);
    }
    window.dispatchEvent(new CustomEvent('musiclub:navigate', { detail: target }));
  };
}

/**
 * Emulates react-router-dom useLocation()
 */
export function useLocation() {
  const pathname = usePathname();
  const [location, setLocation] = useState({ search: '', hash: '' });
  useEffect(() => {
    const update = event => {
      const url = new URL(typeof event?.detail === 'string' ? event.detail : window.location.href, window.location.origin);
      setLocation({ search: url.search, hash: url.hash });
    };
    update();
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    window.addEventListener('musiclub:navigate', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
      window.removeEventListener('musiclub:navigate', update);
    };
  }, [pathname]);

  return {
    pathname: pathname || '/',
    search: location.search,
    hash: location.hash,
    state: {},
  };
}

/**
 * Emulates react-router-dom useParams()
 */
export function useParams() {
  const params = useNextParams();
  return params || {};
}

/**
 * Emulates react-router-dom useSearchParams()
 */
export function useSearchParams() {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = (nextInit) => {
    const nextSearch = new URLSearchParams(nextInit).toString();
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  };

  return [searchParams, setSearchParams];
}

// Fallback exports for common router components
export function BrowserRouter({ children }) {
  return <>{children}</>;
}
export function Router({ children }) {
  return <>{children}</>;
}
export function Routes({ children }) {
  return <>{children}</>;
}
export function Route() {
  return null;
}
export function Navigate({ to, replace }) {
  const router = useRouter();
  React.useEffect(() => {
    if (to) {
      if (replace) router.replace(to);
      else router.push(to);
    }
  }, [to, replace, router]);
  return null;
}
export function Outlet() {
  return null;
}
