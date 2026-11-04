import {getWeightedReviewScore} from './ratingUtils.js';
export const TIER_LIMIT=10;
export const tierPageSize=format=>format==='landscape'?10:['square','compact'].includes(format)?4:6;
export const DEFAULT_TIERS=[['S','Excelentes','9.5–10','#ff7c9a','crown'],['A','Muy buenos','8.5–9.4','#ffb17b','sparkles'],['B','Buenos','7.5–8.4','#f2d271','star'],['C','Regulares','6.5–7.4','#80d4ac','disc'],['D','Por debajo','5–6.4','#7dbbe8','cloud'],['F','No conectaron','Menos de 5','#bea0e4','moon-stars']].map(([id,name,subtitle,hexColor,icon])=>({id,label:id,name,subtitle,hexColor,icon}));
export function roundDownScore(value){return Number.isFinite(Number(value))?Math.floor(Number(value)*10+1e-6)/10:0;}
export function getTierFromScore(value){const score=roundDownScore(value);return score>=9.5?'S':score>=8.5?'A':score>=7.5?'B':score>=6.5?'C':score>=5?'D':'F';}
export function classifyReviews(reviews=[],albumMap=new Map()){
 return reviews.map(review=>{const album=albumMap.get(review.album_id)||review.albums||review.album||{};const rawScore=getWeightedReviewScore(review)??review.rating_general??0;return {reviewId:review.id,albumId:review.album_id||album.id,album:album.album_name||album.album||review.album_title||review.album_name||'Release sin información',artista:album.artist_name||album.artista||review.album_artist||review.artist_name||'',imagen:album.image_url||album.imagen||review.album_image||'',rawScore:Number(rawScore),score:roundDownScore(rawScore),tier:getTierFromScore(rawScore)};}).sort((a,b)=>b.rawScore-a.rawScore||String(a.album).localeCompare(b.album));
}
export function groupTierItems(items=[]){return Object.fromEntries(DEFAULT_TIERS.map(t=>[t.id,items.filter(item=>item.tier===t.id)]));}
export function defaultTierSelection(groups){return Object.fromEntries(DEFAULT_TIERS.map(t=>[t.id,(groups[t.id]||[]).slice(0,TIER_LIMIT).map(item=>item.reviewId)]));}
export function toggleTierSelection(selected,tier,id){const ids=selected[tier]||[];if(ids.includes(id))return {...selected,[tier]:ids.filter(value=>value!==id)};return ids.length>=TIER_LIMIT?selected:{...selected,[tier]:[...ids,id]};}
