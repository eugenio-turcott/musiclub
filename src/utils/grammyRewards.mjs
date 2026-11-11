export const GRAMMY_REWARD_RATES={normal:100,new:200,general:500};
export const GRAMMY_GOLD_PALETTE='from-amber-200 via-yellow-400 to-amber-500 text-amber-950';
export const GRAMMY_BADGES=[
 {id:'grammy_2027_debut',name:'Primer gramófono',icon:'gramophone',metric:'correct_count',required:1,requirement:'Acierta una predicción.'},
 {id:'grammy_2027_ear',name:'Oído de oro',icon:'gramophone-star',metric:'correct_count',required:10,requirement:'Acierta diez predicciones.'},
 {id:'grammy_2027_new',name:'Nuevas voces de oro',icon:'gramophone-spark',metric:'new_correct',required:5,requirement:'Acierta las cinco categorías nuevas.'},
 {id:'grammy_2027_general',name:'Campo General perfecto',icon:'gramophone-crown',metric:'general_correct',required:6,requirement:'Acierta las seis de Campo General.'},
].map(b=>({...b,label:b.name,type:'event',edition:'Grammy 2027 · Oro',color:GRAMMY_GOLD_PALETTE,xp:0,desc:b.requirement}));
export function grammyRewardFor(category){return category?.priority===0?500:category?.isNew?200:100;}
export function grammyGamification(progress={}){
 const count=key=>Math.max(0,Math.trunc(Number(progress?.[key])||0));
 const summary={correct_count:count('correct_count'),normal_correct:count('normal_correct'),new_correct:count('new_correct'),general_correct:count('general_correct')};
 // Only the server's public award aggregate is supplied here, never a profile field or ballot count.
 const xp=summary.normal_correct*100+summary.new_correct*200+summary.general_correct*500;
 return {xp,summary,badges:GRAMMY_BADGES.filter(b=>summary[b.metric]>=b.required)};
}
