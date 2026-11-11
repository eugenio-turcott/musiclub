import {GrammyPage} from '../../views/GrammyPage';
import {getGrammyState} from '../../server/grammys';
export const dynamic='force-dynamic';
export const metadata={title:'Grammy 2027 · Predicciones del club',description:'Explora las 100 categorías de los Grammy 2027. Recibe un recordatorio, escucha a los nominados y prepara tus predicciones en Musiclub.',alternates:{canonical:'https://www.musiclub.org/grammys'},openGraph:{title:'Grammy 2027 · ¿Quién va a ganar?',description:'Escucha, califica y predice con Musiclub.',url:'https://www.musiclub.org/grammys'}};
export default async function GrammyRoute(){let state;try{state=await getGrammyState();}catch{state={event:{status:'preparing'},nominees:[],unavailable:true};}return <GrammyPage initialState={{...state,now:Date.now()}}/>;}
