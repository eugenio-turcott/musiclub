import application from '../../.open-next/worker.js';
import placements from '../utils/adsterraPlacements.cjs';
import {scheduledPaths} from './scheduledPaths.mjs';
export {DOQueueHandler,DOShardedTagCache,BucketCachePurge} from '../../.open-next/worker.js';

export default {
  async scheduled(controller,env,ctx) {
    if(!env.CRON_SECRET)throw new Error('Scheduled tasks require CRON_SECRET');
    const routes=scheduledPaths(controller.scheduledTime);
    const results=await Promise.allSettled(routes.map(async route=>{
      const response=await application.fetch(new Request('https://www.musiclub.org'+route,{method:'POST',headers:{Authorization:`Bearer ${env.CRON_SECRET}`}}),env,ctx);
      if(!response.ok)throw new Error('Scheduled task failed: '+route+' ('+response.status+')');
    }));
    if(results.some(result=>result.status==='rejected'))throw new Error('One or more scheduled tasks failed');
  },
  fetch(request,env,ctx) {
    if(placements.isAdvertisingHost(new URL(request.url).hostname)) {
      return placements.advertisingHostResponse(request);
    }
    return application.fetch(request,env,ctx);
  },
};
