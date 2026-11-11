import artwork from './interfaceArtwork.cjs';
import icons from './interfaceIcons.cjs';
import {GRAMMY_BADGES} from './grammyRewards.mjs';
import {PROGRESSION_BADGES,PERSONALITY_BADGES,RECORD_BADGES_CONFIG,MELOMANO_LEVELS} from './badgeSystem.js';
export const badgeText=value=>(icons.iconParts(String(value||''))||[{text:String(value||'')}]).filter(part=>part.text).map(part=>part.text).join('').replace(/\s+/g,' ').trim();
const descriptors=[...RECORD_BADGES_CONFIG.map(b=>({...b,name:b.label})),...Object.values(PROGRESSION_BADGES).flatMap(b=>b.tiers.map(t=>({...t,id:`${b.id}_t${t.tier}`,badgeKey:b.id}))),...Object.values(PERSONALITY_BADGES).flatMap(b=>b.tiers.map(t=>({...t,id:`${b.id==='strict_critic'?'strict':'generous'}_t${t.tier}`,badgeKey:b.id}))),...GRAMMY_BADGES];
const preferred=['crown','zap','feather','star-spark','sliders','search','mixer','brain','gem','planet','map','compass','comet','infinity','headphones','music','notes','radio','saxophone','archive','library','disc','layers','globe','review','pen','book','scroll','mic','bell','keyboard','image','palette','award','sparkles','star','heart','sun','moon','flame','rocket','shield','anchor','leaf','flower','diamond','target','trophy','orbit','bolt','ear','piano','guitar','drum','trumpet','violin','harp','camera','film','satellite','geometry','wave','mountain','snowflake','cloud','umbrella','coffee','hourglass','lock','key','eye','speaker','volume','flag','signpost','bulb'];
const reserved=new Set(GRAMMY_BADGES.map(b=>b.icon));
const used=new Set(),available=[...preferred,...Object.keys(artwork.ICON_BODIES)].filter((name,index,array)=>!reserved.has(name)&&array.indexOf(name)===index&&artwork.ICON_BODIES[name]).filter(name=>{const body=artwork.ICON_BODIES[name].replace(/\s+/g,'');if(used.has(body))return false;used.add(body);return true;});
if(available.length<descriptors.length)throw new Error('Cada insignia necesita una figura diferente');
const usedBodies=new Set();
const extraIcons={tracks_t7:'map',tracks_t8:'compass',tracks_t9:'comet',tracks_t10:'infinity',reviews_t8:'book-2',reviews_t9:'world',reviews_t10:'archive',comments_t7:'microphone-2',comments_t8:'quill',comments_t9:'vocabulary',comments_t10:'notebook',tens_t7:'crystal',tens_t8:'diamondMark',tens_t9:'atom',tens_t10:'folder'};
const choose=candidates=>{const name=candidates.find(key=>{const body=artwork.ICON_BODIES[key]?.replace(/\s+/g,'');return body&&!usedBodies.has(body);});if(!name)throw new Error('Falta una figura propia');usedBodies.add(artwork.ICON_BODIES[name].replace(/\s+/g,''));return name;};
export const BADGE_ICONS=Object.fromEntries(descriptors.map(badge=>[badge.id,choose([badge.type==='event'?badge.icon:undefined,(icons.iconParts(badge.name)||[]).find(p=>p.icon)?.icon,extraIcons[badge.id],...available])]));
const byLabel=new Map(descriptors.map(b=>[badgeText(b.name),BADGE_ICONS[b.id]]));
export function badgeIcon(badge){return BADGE_ICONS[badge.id]||byLabel.get(badgeText(badge.label||badge.name||badge.title))||'award';}
export const ALL_BADGE_DESCRIPTORS=descriptors;
const levelFigures=['audioLow','audioMid','volumeHigh','metronome','compactDisc','turntable','encyclopedia','galaxy','device-audio-tape','atom','quill','antenna','ufo','building-monument','wave-sine','file-music'];
export const LEVEL_ICONS=Object.fromEntries(MELOMANO_LEVELS.map((level,i)=>[level.level,choose([levelFigures[i],'device-speaker','electricGuitar','flute','synthesizer','harmonica','maracas','accordion','banjo',...available])]));
