import { UiIcon } from './UiIcon';

export const REVIEW_CRITERIA = [
  ['rating_produccion','Producción','sliders',5],
  ['rating_composicion','Composición','music',5],
  ['rating_letras','Letras','review',5],
  ['rating_originalidad','Originalidad','bulb',5],
  ['rating_cohesion','Cohesión','link',5],
  ['rating_replay','Replay Value','repeat',5],
  ['rating_general','General','star',10],
];

export default function ReviewCriteria({ review }) {
  return <div className="review-criteria" aria-label="Criterios de la reseña">
    {REVIEW_CRITERIA.map(([key,label,icon,max]) => <div key={key} className="review-criterion" title={`${label}: ${review[key] ?? 'sin calificar'} / ${max}`} aria-label={`${label}: ${review[key] ?? 'sin calificar'} de ${max}`}>
      <UiIcon name={icon} size={26} tone="accent"/>
      <span className="font-black tabular-nums text-sm sm:text-base">{review[key] ?? '—'}<small className="text-[10px] font-medium text-slate-500">/{max}</small></span>
    </div>)}
  </div>;
}
