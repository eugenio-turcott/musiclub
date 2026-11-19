// Only public playlist presentation fields cross this boundary; RLS still applies.
export async function readAnnualPlaylists(db){
 const {data,error}=await db.from('playlists').select('id,title,curator_name,image_url,genre_or_mood,created_at').gte('created_at','2026-01-01T06:00:00Z').lt('created_at','2027-01-01T06:00:00Z').order('created_at',{ascending:false}).limit(6);
 if(error)throw new Error('No pudimos cargar las playlists del año.');
 return (data||[]).map(({id,title,curator_name,image_url,genre_or_mood})=>({id,title,curator_name,image_url,genre_or_mood}));
}
