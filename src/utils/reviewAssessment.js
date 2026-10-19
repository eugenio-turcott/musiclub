export function reviewAssessment(ratings, trackRatings) {
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
