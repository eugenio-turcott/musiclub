const limits = {produccion:5, composicion:5, letras:5, originalidad:5, cohesion:5, replay:5, general:10};

// Old drafts included automatic 3/5 and 5/10 scores. They cannot prove that
// those scores were selected, so only explicit, non-default values survive.
export function restoreReviewDraft(draft, user) {
  if (!draft || typeof draft !== 'object' || !user?.id) return null;
  const current = draft.version === 2;
  if (current ? draft.userId !== user.id :
    !user.email || draft.userEmail?.trim().toLowerCase() !== user.email.trim().toLowerCase()) return null;
  const ratings = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = draft.ratings?.[key];
    if (Number.isInteger(value) && value >= 1 && value <= max &&
      (current || value !== (max === 10 ? 5 : 3))) ratings[key] = value;
  }
  const index = value => Number.isInteger(value) && value >= 0 ? value : 0;
  return {...draft, ratings,
    trackRatings: Object.fromEntries(Object.entries(draft.trackRatings || {})
      .filter(([,value]) => Number.isInteger(value) && value >= 1 && value <= 10)),
    wizardStep: ['tracks','criteria','summary'].includes(draft.wizardStep) ? draft.wizardStep : 'tracks',
    currentTrackIndex:index(draft.currentTrackIndex),
    currentCriterionIndex:index(draft.currentCriterionIndex),
    migrated:!current,
  };
}
