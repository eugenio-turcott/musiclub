import { UiIcon } from './UiIcon';

import {REVIEW_CRITERIA} from '../utils/reviewCriteria.mjs';
export {REVIEW_CRITERIA};

export default function ReviewCriteria({ review }) {
  return <div className="review-criteria" aria-label="Criterios de la reseña">
    {REVIEW_CRITERIA.map(([key,label,icon,max,color]) => <div key={key} className="review-criterion" title={`${label}: ${review[key] ?? 'sin calificar'} / ${max}`} aria-label={`${label}: ${review[key] ?? 'sin calificar'} de ${max}`}>
      <UiIcon name={icon} size={26} tone="inherit" style={{color}}/>
      <span className="font-black tabular-nums text-sm sm:text-base">{review[key] ?? '—'}<small className="text-[10px] font-medium text-slate-500">/{max}</small></span>
    </div>)}
  </div>;
}
