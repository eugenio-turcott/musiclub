'use client';
import { useId } from 'react';
import styles from './MusiclubVinyl.module.css';

const COLORS = {
  '/musiclub_logo.png': ['#000000', '#15132f', '#56408b'],
  '/musiclub_logo_2.png': ['#15132f', '#56408b', '#000000'],
  '/musiclub_logo_3.png': ['#000000', '#56408b', '#15132f'],
  '/musiclub_logo_4.png': ['#000000', '#ffdae5', '#56408b'],
};

// The brand label stays upright; only the three outer vinyl reflections rotate.
export function MusiclubVinyl({ src = '/musiclub_logo_3.png', alt = 'Musiclub', className = '', showCenter = true, ...props }) {
  const labelClipId = `musiclub-label-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [disc, reflection, label] = COLORS[src] || COLORS['/musiclub_logo_3.png'];
  const fast = className.includes('animate-disc-spin');
  const frameClass = className.replace(/\banimate-(?:disc-spin|spin-slow)\b/g, '').trim();
  return (
    <svg {...props} viewBox="0 0 710 710" role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} focusable="false" className={`${styles.frame} ${frameClass}`} data-musiclub-vinyl="">
      <g className={fast ? styles.fast : styles.slow} data-vinyl-part="disc">
        <circle cx="355" cy="355" r="355" fill={disc} />
        <path d="M355 355 601 100 A355 355 0 0 1 688 232Z M355 355 707 307 A355 355 0 0 1 708 392Z M355 355 109 611 A355 355 0 0 1 2 313Z" fill={reflection} />
      </g>
      <circle cx="355" cy="355" r="173.5" fill={label} />
      {showCenter && (
        <g clipPath={`url(#${labelClipId})`} data-vinyl-part="label">
          <defs>
            <clipPath id={labelClipId} clipPathUnits="userSpaceOnUse">
              <circle cx="355" cy="355" r="173.5" />
            </clipPath>
          </defs>
          <image href={src} x="-11.5" y="7.5" width="711" height="710" />
        </g>
      )}
    </svg>
  );
}
