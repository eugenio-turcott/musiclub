export const notificationStorageKey = owner => `musiclub_notifs_sent_${owner}`;
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function notificationIds(items) {
  return [...new Set(items.map(item => item.id))].filter(id => typeof id === 'string' && /^(?:winner_|mailbox_|review_|upcoming_|continue-review:).{1,220}$/.test(id));
}

export function readNotificationDates(storage, owner) {
  try {
    const saved = JSON.parse(storage?.getItem(notificationStorageKey(owner)) || '{}');
    return Object.fromEntries(Object.entries(saved).filter(([,value]) => validDate(value)));
  } catch { return {}; }
}

export function saveNotificationDates(storage, owner, dates) {
  try { storage?.setItem(notificationStorageKey(owner), JSON.stringify(dates)); } catch { /* The server remains authoritative. */ }
}

export function withNotificationDates(items, dates) {
  return items.map(item => {
    const sentAt = Object.hasOwn(dates, item.id) && validDate(dates[item.id]) ? dates[item.id] : null;
    return {...item, sentAt, timestamp:sentAt ? Date.parse(sentAt) : 0, dateFormatted:sentAt};
  }).sort((a,b) => b.timestamp-a.timestamp);
}

// Guest notices have no account inbox: retain the first local delivery time.
export function guestNotificationDates(items, previous, now = new Date().toISOString()) {
  const dates = {...previous};
  for (const id of notificationIds(items)) if (!Object.hasOwn(dates,id)) dates[id] = now;
  return dates;
}
