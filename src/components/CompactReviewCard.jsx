'use client';
import ReviewCriteria from './ReviewCriteria';
import ReviewTrackRatings from './ReviewTrackRatings';
import MoodIcon from './MoodIcon';
import {UiIcon} from './UiIcon';
import {getWeightedReviewScore,getEmotionFromReview,getReviewFavoriteTrack,getTrackDisplayName} from '../utils/ratingUtils';
export function CompactReviewCard({review,album,tracks=[]}) {
  const score=getWeightedReviewScore(review)??review.rating_general,mood=getEmotionFromReview(review);
  const favorite=getReviewFavoriteTrack(review);
  return <article className="compact-review-card" aria-label={`Reseña de ${review.reviewer_name || 'Miembro'}`}>
    <header><img src={album?.image_url||album?.imagen||'/musiclub_logo_corchea.png'} alt={album?.album_name||album?.album||'Portada'} width="54" height="54" loading="lazy"/><div className="compact-review-author"><strong>{review.reviewer_name || 'Miembro'}</strong><small>{review.created_at?new Date(review.created_at).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}):'Reseña del club'}</small></div><div className="compact-review-score">{mood&&<MoodIcon mood={mood.id} size={30}/>}<span><UiIcon name="star" style={{color:'#f55799'}}/>{score==null?'—':Number(score).toFixed(1)}</span></div></header>
    {review.comment?<p className="compact-review-quote">“{review.comment}”</p>:<p className="compact-review-empty">Calificación compartida con el club.</p>}
    {favorite&&<p className="compact-review-favorite"><UiIcon name="crown" tone="inherit"/><span>{getTrackDisplayName(favorite,tracks)}</span></p>}
    <ReviewCriteria review={review}/>
    <ReviewTrackRatings review={review} tracks={tracks}/>
  </article>;
}
