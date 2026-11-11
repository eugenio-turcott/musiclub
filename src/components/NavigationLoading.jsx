'use client';
import {AppHeader} from './AppHeader';
import {DetailLoading} from './DetailLoading';

// Direct client-only views may still need an initial read. Keep this compact;
// route transitions retain the current page and use NavigationProgress instead.
export function NavigationLoading({label='Cargando sección…'}){
  return <div className="cyber-grid min-h-screen p-3"><div className="mx-auto max-w-7xl"><AppHeader showAdvertising={false}/><main className="mx-auto mt-4 max-w-5xl"><DetailLoading label={label}/></main></div></div>;
}
