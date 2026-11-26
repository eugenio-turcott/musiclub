import {isSingleTrackRelease,singleTrackScore} from './releaseScoring.cjs';
export function reviewAssessment(ratings, trackRatings, release) {
  if(isSingleTrackRelease(release)){
    const score=singleTrackScore(release,trackRatings);
    if(score===null)throw new Error('Califica la canción entre 1 y 10.');
    return {trackRatings,ratingGeneral:score,ratingProduccion:null,ratingComposicion:null,ratingLetras:null,ratingOriginalidad:null,ratingCohesion:null,ratingReplay:null};
  }
  const general = Number(ratings.general);
  if (!Number.isFinite(general) || general < 1 || general > 10) throw new Error('Elige una calificación entre 1 y 10.');
  const result = { trackRatings, ratingGeneral: general };
  for (const key of ['produccion', 'composicion', 'letras', 'originalidad', 'cohesion', 'replay']) {
    const value = Number(ratings[key]);
    if (!Number.isFinite(value) || value < 1 || value > 5) throw new Error('Califica cada pilar entre 1 y 5.');
    result['rating' + key[0].toUpperCase() + key.slice(1)] = value;
  }
  return result;
}
