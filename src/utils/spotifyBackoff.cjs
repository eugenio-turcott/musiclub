// One process shares a cooldown across search, artist refreshes and the proxy.
// An optional deployment deadline also survives worker restarts.
function createSpotifyBackoff({now=Date.now,deadline=()=>process.env.SPOTIFY_API_RETRY_UNTIL}={}){
 let until=0;
 return async function request(input,options,fetcher=globalThis.fetch){
  const url=new URL(String(input),'https://www.musiclub.org');
  if(url.origin!=='https://api.spotify.com')return fetcher(input,options);
  const remaining=Math.ceil((Math.max(until,Date.parse(deadline()||'')||0)-now())/1000);
  if(remaining>0)return new Response(JSON.stringify({error:{status:429,message:'Spotify cooldown'}}),{status:429,headers:{'Content-Type':'application/json','Retry-After':String(remaining)}});
  const response=await fetcher(input,options);
  if(response.status===429){
   const raw=response.headers.get('retry-after'),seconds=Number(raw);
   const wait=raw&&Number.isFinite(seconds)?Math.max(1,seconds)*1000:Math.max(1000,(Date.parse(raw||'')||now()+60000)-now());
   until=Math.max(until,now()+wait);
  }
  return response;
 };
}
const spotifyRequest=createSpotifyBackoff();
module.exports={createSpotifyBackoff,spotifyRequest};
