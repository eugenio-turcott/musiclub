// Publication checks run every five minutes; Grammy mail keeps its fifteen-minute cadence.
export function scheduledPaths(scheduledTime){
 const time=new Date(scheduledTime);if(!Number.isFinite(time.getTime()))throw new Error('Invalid scheduled time');
 return ['/api/search-discovery',...(time.getUTCMinutes()%15===0?['/api/grammys/reminders']:[])];
}
