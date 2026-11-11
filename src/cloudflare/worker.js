import application from '../../.open-next/worker.js';
import placements from '../utils/adsterraPlacements.cjs';
export {DOQueueHandler,DOShardedTagCache,BucketCachePurge} from '../../.open-next/worker.js';

export default {
  async scheduled(controller,env,ctx) {
    if(!env.CRON_SECRET)throw new Error('Grammy reminders require CRON_SECRET');
    const response=await application.fetch(new Request('https://www.musiclub.org/api/grammys/reminders',{method:'POST',headers:{Authorization:`Bearer ${env.CRON_SECRET}`}}),env,ctx);
    if(!response.ok)throw new Error('Grammy reminder batch failed: '+response.status);
  },
  fetch(request,env,ctx) {
    if(placements.isAdvertisingHost(new URL(request.url).hostname)) {
      return placements.advertisingHostResponse(request);
    }
    return application.fetch(request,env,ctx);
  },
};
