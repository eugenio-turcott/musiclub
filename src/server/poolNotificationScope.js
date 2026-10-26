// Legacy broadcasts must never disclose another room's private activity.
export async function legacyPoolNotificationScope(db, seasonId, albumId, status) {
  if (!seasonId || !albumId) return null;
  const { data: season, error } = await db.from('seasons').select('id,name,room_id').eq('id', seasonId).maybeSingle();
  if (error || !season || season.room_id !== '00000000-0000-4000-8000-000000000000') return null;
  const { data: entry, error: entryError } = await db.from('pool_entries').select('id,nominated_by').eq('season_id', seasonId).eq('album_id', albumId).eq('status', status).maybeSingle();
  return !entryError && entry ? { season, entry } : null;
}
