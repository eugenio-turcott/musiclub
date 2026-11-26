// Publication and annual notices run every five minutes; Grammy mail and genres every fifteen.
export function scheduledPaths(scheduledTime){
 const time=new Date(scheduledTime);if(!Number.isFinite(time.getTime()))throw new Error('Invalid scheduled time');
 const annual=time.getTime()>=Date.parse('2026-11-26T00:00:00Z')&&time.getTime()<Date.parse('2027-01-01T06:00:00Z');
 return ['/api/search-discovery',...(time.getUTCMinutes()%15===0?['/api/grammys/reminders','/api/genres/pending']:[]),...(annual?['/api/annual/2026/mail']:[])];
}
