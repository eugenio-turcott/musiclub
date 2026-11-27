export async function recordNotificationReceipts(db,userId,ids) {
  if (!ids.length) return [];
  const result=await db.from('musiclub_inbox_receipts').upsert(ids.map(notification_id=>({user_id:userId,notification_id})),{onConflict:'user_id,notification_id',ignoreDuplicates:true,defaultToNull:false});
  if (result.error) throw result.error;
  const {data,error}=await db.from('musiclub_inbox_receipts').select('notification_id,sent_at').eq('user_id',userId).in('notification_id',ids);
  if (error) throw error;
  return data || [];
}
