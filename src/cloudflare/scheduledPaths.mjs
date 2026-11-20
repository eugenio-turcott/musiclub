// Publication checks run every five minutes; mail and missing genres every fifteen.
export function scheduledPaths(scheduledTime){
 const time=new Date(scheduledTime);if(!Number.isFinite(time.getTime()))throw new Error('Invalid scheduled time');
 return ['/api/search-discovery',...(time.getUTCMinutes()%15===0?['/api/grammys/reminders','/api/genres/pending']:[])];
}
