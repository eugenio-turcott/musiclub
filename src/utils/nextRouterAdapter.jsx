'use client';
import React, { forwardRef } from 'react';
import NextLink from 'next/link';
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation';

/**
 * Universal Link component compatible with both React Router ('to' prop)
 * and Next.js ('href' prop).
 */
export const Link = forwardRef(function Link(
  { to, href, replace, children, ...props },
  ref
) {
  const target = href || to || '#';
  return (
    <NextLink ref={ref} href={target} replace={replace} {...props}>
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
  return (destination, options) => {
    if (typeof destination === 'number') {
      if (destination < 0) {
        router.back();
      } else {
        router.forward();
      }
      return;
    }
    if (options?.replace) {
      router.replace(destination);
    } else {
      router.push(destination);
    }
  };
}

/**
 * Emulates react-router-dom useLocation()
 */
export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const searchStr = searchParams?.toString();

  return {
    pathname: pathname || '/',
    search: searchStr ? `?${searchStr}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
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
  const searchParams = useNextSearchParams();
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
