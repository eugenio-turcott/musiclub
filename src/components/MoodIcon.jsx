import { useId } from 'react';

// Purpose-made expressions share one silhouette and remain legible at badge size.
export default function MoodIcon({ mood = 'unknown', size = 36, className = '' }) {
  const id = useId().replace(/:/g, '');
  const colors = { euforico:'#fbbf24', inspirado:'#34d399', relajado:'#22d3ee', intrigado:'#c084fc', melancolico:'#a5b4fc', indiferente:'#cbd5e1', asco:'#a3e635', unknown:'#d8b4fe' };
  const color = colors[mood] || colors.unknown;
  const eyes = mood === 'euforico' ? <g fill="currentColor" strokeWidth="1.4"><path d="m20 20 1.7 3.4 3.8.6-2.7 2.6.6 3.8-3.4-1.8-3.4 1.8.6-3.8-2.7-2.6 3.8-.6Z"/><path d="m44 20 1.7 3.4 3.8.6-2.7 2.6.6 3.8-3.4-1.8-3.4 1.8.6-3.8-2.7-2.6 3.8-.6Z"/></g>
    : mood === 'relajado' ? <><path d="M16 26q5 5 10 0M38 26q5 5 10 0"/></>
    : mood === 'intrigado' ? <><path d="m17 21 10-2M39 19l9 4"/><ellipse cx="22" cy="28" rx="2.3" ry="3" fill="currentColor"/><ellipse cx="43" cy="28" rx="2.3" ry="3" fill="currentColor"/></>
    : mood === 'asco' ? <><path d="m17 23 9 4-9 4m30-8-9 4 9 4"/></>
    : <><ellipse cx="22" cy="26" rx="2.8" ry="3.5" fill="currentColor"/><ellipse cx="43" cy="26" rx="2.8" ry="3.5" fill="currentColor"/>{mood === 'melancolico' && <path d="m44 33-3 5a3.5 3.5 0 0 0 6 0Z" fill="currentColor" stroke="none"/>}</>;
  return <svg viewBox="0 0 64 64" width={size} height={size} style={{width:size,height:size,color}} className={`mood-icon shrink-0 ${className}`} data-mood-icon={mood} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <defs><radialGradient id={`mood-${id}`} cx="32%" cy="20%" r="85%"><stop stopColor={color} stopOpacity=".42"/><stop offset="1" stopColor={color} stopOpacity=".08"/></radialGradient></defs>
    <circle cx="32" cy="32" r="30" fill={color} opacity=".09" stroke="none"/>
    <circle cx="32" cy="32" r="25" fill={`url(#mood-${id})`} strokeWidth="2.5"/>
    <path d="M16 18q6-7 15-7" stroke="white" opacity=".35" strokeWidth="2"/>
    {mood === 'unknown' ? <><path d="M25 23a7 7 0 0 1 14 1c0 5-7 5-7 10"/><circle cx="32" cy="42" r="1.8" fill="currentColor" stroke="none"/></> : <>{eyes}
      {mood === 'euforico' ? <path d="M21 37q11 17 22 0Z" fill="currentColor" fillOpacity=".32"/> : mood === 'inspirado' ? <path d="M20 37q12 15 24 0"/> : mood === 'relajado' ? <path d="M25 39q7 5 14 0"/> : mood === 'intrigado' ? <><path d="m24 40 9-2M36 48l4-10a3 3 0 0 1 5 2l-1 7"/><path d="m32 46 6 4h7"/></> : mood === 'melancolico' ? <path d="M23 43q8-8 15-2"/> : mood === 'indiferente' ? <path d="M23 40h18"/> : <path d="M23 41q4-8 9-3 5-5 9 3"/>}
      {['euforico','inspirado','relajado'].includes(mood) && <g fill="currentColor" opacity=".2" stroke="none"><ellipse cx="16" cy="34" rx="4" ry="2"/><ellipse cx="48" cy="34" rx="4" ry="2"/></g>}
    </>}
  </svg>;
}
