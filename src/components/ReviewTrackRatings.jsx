import { getSortedTrackRatings, getReviewFavoriteTrack } from '../utils/ratingUtils';
import { UiIcon } from './UiIcon';

export default function ReviewTrackRatings({ review, tracks, summaryLabel }) {
  const rows = getSortedTrackRatings(review.track_ratings, tracks, getReviewFavoriteTrack(review));
  if (!rows.length) return null;
  return <details className="review-track-ratings group/tracks">
    <summary className="flex items-center gap-2 cursor-pointer list-none rounded-xl bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-pink-400">
      <UiIcon name="notes"/><span className="flex-1">{summaryLabel || `${rows.length} canciones evaluadas`}</span><span className="text-pink-300 group-open/tracks:rotate-180 transition-transform" aria-hidden="true">⌄</span>
    </summary>
    <ol className="mt-2 max-h-64 overflow-y-auto custom-scrollbar space-y-1.5" aria-label="Canciones ordenadas por calificación, después por tracklist">
      {rows.map(row => <li key={row.key} className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-xs ${row.isFavorite ? 'bg-amber-500/15 border-amber-400/30 text-amber-200' : 'bg-black/25 border-white/5 text-slate-300'}`}>
        <span className="w-6 shrink-0 text-[10px] text-slate-500">{row.index >= 0 ? `#${row.index + 1}` : '—'}</span>
        {row.isFavorite && <UiIcon name="crown" size={18}/>}
        <span className="flex-1 min-w-0 break-words">{row.name}</span><strong className="shrink-0 tabular-nums text-sm">{row.score}<small className="text-[10px] opacity-50">/10</small></strong>
      </li>)}
    </ol>
  </details>;
}
