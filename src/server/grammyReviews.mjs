import {grammyReviewSummary} from '../utils/grammyListening.mjs';

export async function readGrammyReviews(db,userEmail) {
 if(!userEmail)return grammyReviewSummary([]);
 const rows=[],pageSize=500;
 for(let offset=0;;offset+=pageSize){
  const result=await db.from('reviews').select('album_id,albums(id,album_name,artist_name,release_type)').eq('reviewer_email',userEmail).order('id').range(offset,offset+pageSize-1);
  if(result.error)throw new Error('No pudimos consultar tus reseñas.');
  rows.push(...(result.data||[]));
  if((result.data||[]).length<pageSize)return grammyReviewSummary(rows);
 }
}
