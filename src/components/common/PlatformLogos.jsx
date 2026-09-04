import React from 'react';

/**
 * Logos vectoriales SVG oficiales para plataformas de streaming musical
 * Utilizados globalmente en Musiclub (Release detail, Playlists, Buzón, Admin, etc.)
 */

export function SpotifyLogo({ className = 'w-4 h-4', ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.216.353-.674.468-1.027.252-2.81-1.718-6.347-2.107-10.514-1.155-.403.092-.807-.16-.899-.563-.092-.403.16-.807.563-.899 4.568-1.044 8.49-.607 11.625 1.338.353.216.468.674.252 1.027zm1.47-3.268c-.272.443-.853.585-1.296.313-3.218-1.978-8.123-2.55-11.928-1.395-.499.151-1.03-.134-1.181-.633-.151-.499.134-1.03.633-1.181 4.354-1.322 9.775-.684 13.459 1.58.443.272.585.853.313 1.296zm.126-3.41c-3.858-2.29-10.222-2.502-13.886-1.39-.59.179-1.217-.156-1.396-.746-.179-.59.156-1.217.746-1.396 4.218-1.28 11.248-1.036 15.688 1.597.531.315.704 1.002.389 1.533-.315.531-1.002.704-1.541.402z" />
    </svg>
  );
}

export function AppleMusicLogo({ className = 'w-4 h-4', ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.541 7.228l-.004 6.741c0 1.834-1.42 2.86-3.14 2.86-1.82 0-3.16-1.28-3.16-3.05 0-1.79 1.38-3.03 3.24-3.03.54 0 1.02.11 1.42.31V8.62l-5.33 1.23v5.9c0 1.84-1.42 2.86-3.14 2.86-1.82 0-3.16-1.28-3.16-3.05 0-1.79 1.38-3.03 3.24-3.03.54 0 1.02.11 1.42.31V6.78c0-.59.41-1.06 1.01-1.18l6.72-1.54c.23-.05.46-.03.67.07.21.1.36.28.41.51.06.23.03.46-.07.67-.1.21-.29.36-.51.41l-4.19.96z" />
    </svg>
  );
}

export function YouTubeLogo({ className = 'w-4 h-4', ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function DeezerLogo({ className = 'w-4 h-4', ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M6.06 17.06v3.41H3.59v-3.41h2.47zm0-4.83v3.41H3.59v-3.41h2.47zm0-4.83v3.41H3.59V7.4h2.47zm4.27 9.66v3.41H7.86v-3.41h2.47zm0-4.83v3.41H7.86v-3.41h2.47zm0-4.83v3.41H7.86V7.4h2.47zm0-4.83v3.41H7.86V2.57h2.47zm4.28 14.49v3.41h-2.47v-3.41h2.47zm0-4.83v3.41h-2.47v-3.41h2.47zm0-4.83v3.41h-2.47V7.4h2.47zm4.27 9.66v3.41h-2.47v-3.41h2.47zm0-4.83v3.41h-2.47v-3.41h2.47zm0-4.83v3.41h-2.47V7.4h2.47zm0-4.83v3.41h-2.47V2.57h2.47zm4.28 14.49v3.41h-2.47v-3.41h2.47zm0-4.83v3.41h-2.47v-3.41h2.47zm0-4.83v3.41h-2.47V7.4h2.47zm0-4.83v3.41h-2.47V2.57h2.47z" />
    </svg>
  );
}

const PlatformLogos = {
  SpotifyLogo,
  AppleMusicLogo,
  YouTubeLogo,
  DeezerLogo,
};

export default PlatformLogos;
