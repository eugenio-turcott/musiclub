import application from '../../.open-next/worker.js';
import placements from '../utils/adsterraPlacements.cjs';
export {DOQueueHandler,DOShardedTagCache,BucketCachePurge} from '../../.open-next/worker.js';

export default {
  fetch(request,env,ctx) {
    if(placements.isAdvertisingHost(new URL(request.url).hostname)) {
      return placements.advertisingHostResponse(request);
    }
    return application.fetch(request,env,ctx);
  },
};
