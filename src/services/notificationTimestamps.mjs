import {notificationIds,readNotificationDates,saveNotificationDates,guestNotificationDates,withNotificationDates} from '../utils/notificationTimestamps.mjs';

export async function dateDeliveredNotifications(items, {owner,userId,storage,request}) {
  let dates = readNotificationDates(storage,owner);
  if (userId) {
    const ids = notificationIds(items);
    for (let offset=0;offset<ids.length;offset+=100) {
      try {
        const response = await request('/api/notifications/timestamps',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:ids.slice(offset,offset+100),userId})});
        if (!response.ok) continue;
        const data = await response.json();
        for (const receipt of data.receipts || []) if (ids.includes(receipt.notification_id) && typeof receipt.sent_at==='string' && Number.isFinite(Date.parse(receipt.sent_at))) dates[receipt.notification_id]=receipt.sent_at;
      } catch { /* Retain confirmed dates during an outage; never substitute release dates. */ }
    }
  } else dates=guestNotificationDates(items,dates);
  saveNotificationDates(storage,owner,dates);
  return withNotificationDates(items,dates);
}
