import {annualIsPublished} from '../data/annual2026Launch.mjs';
// URL parameters never grant preview access; identity always comes from authorize.
export async function annualAccess(request,{authorize,publicDb,now=Date.now()}){
 const published=annualIsPublished(now);
 if(!published||request.headers.has('authorization'))return authorize(request,{admin:!published});
 return {user:null,db:publicDb()};
}
