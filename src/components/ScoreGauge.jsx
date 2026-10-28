import { useId } from 'react';

export function ScoreGauge({ value, label = 'Calificación final' }) {
  const id = useId().replace(/:/g, '');
  const valid = value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const score = valid ? Math.max(0, Math.min(10, Number(value))) : 0;
  const color = `hsl(${score * 12} 72% 52%)`;
  return <div className="score-gauge" role="img" aria-label={`${label}: ${valid ? `${score.toFixed(2)} de 10` : 'sin calificar'}`}>
    <svg viewBox="0 0 200 160" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="1" x2="1" y2="0"><stop stopColor={color} /><stop offset="1" stopColor={`hsl(${score * 12} 85% 68%)`} /></linearGradient></defs>
      <path d="M 38 137 A 76 76 0 1 1 162 137" pathLength="100" fill="none" stroke="currentColor" strokeWidth="12" className="text-white/10" strokeLinecap="round" />
      {valid && <path d="M 38 137 A 76 76 0 1 1 162 137" pathLength="100" fill="none" stroke={`url(#${id})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${score * 10} 100`} />}
      <text x="100" y="99" textAnchor="middle" fill={valid ? color : '#94a3b8'} fontSize={valid ? 39 : 22} fontWeight="900">{valid ? score.toFixed(2) : '—'}</text>
      <text x="100" y="123" textAnchor="middle" fill="#94a3b8" fontSize="11">{valid ? 'DE 10' : 'SIN CALIFICAR'}</text>
    </svg>
  </div>;
}
