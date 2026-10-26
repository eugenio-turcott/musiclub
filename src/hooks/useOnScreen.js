import { useEffect, useRef, useState } from 'react';

// Keep the server and first client render identical; observe after hydration.
export function useOnScreen({ rootMargin = '0px', once = false, enabled = true } = {}) {
 const ref = useRef(null);
 const [visible, setVisible] = useState(false);
 useEffect(() => {
  const element = ref.current;
  if (!element || !enabled) return;
  if (!('IntersectionObserver' in window)) { setVisible(true); return; }
  const observer = new IntersectionObserver(([entry]) => {
   setVisible(entry.isIntersecting);
   if (once && entry.isIntersecting) observer.disconnect();
  }, { rootMargin });
  observer.observe(element);
  return () => observer.disconnect();
 }, [rootMargin, once, enabled]);
 return [ref, visible];
}
