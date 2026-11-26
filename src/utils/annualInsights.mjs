export function annualMetricDetails(stats){
 const reviews=Number(stats.reviewCount)||0,comments=Number(stats.commentCount)||0;
 return {
  tracks:reviews?`${((Number(stats.trackCount)||0)/reviews).toFixed(1)} canciones por reseña, en promedio.`:'Cada canción que califiques sumará a tu recorrido.',
  comments:reviews?`Pusiste en palabras el ${Math.round(comments/reviews*100)}% de tus reseñas.`:'Aquí también cuenta lo que tienes que decir.',
  score:stats.meanScore==null?'Tu próxima reseña empezará a dibujar este promedio.':stats.meanScore>=8?'Un año de discos que disfrutaste especialmente.':stats.meanScore>=6?'Disfrutaste, comparaste y dejaste tu propio criterio.':'Escuchaste con atención y reservaste tus mejores notas.',
  genres:stats.genres?.[0]?`${stats.genres[0].name} encabezó tu mapa de sonidos.`:'Tu mapa musical crece con cada release.',
  days:stats.longestStreak?`Tu mejor racha fue de ${stats.longestStreak} ${stats.longestStreak===1?'día':'días'} seguidos.`:'Cada visita puede convertirse en una nueva escucha.',
  perfect:stats.perfectCount?`${stats.perfectCount===1?'Un release se ganó':'Estos releases se ganaron'} tu nota más especial.`:'Tu 10 ponderado todavía espera su disco.',
 };
}
export function annualMilestones(stats){
 const result=[];
 if(stats.trackCount>=1000)result.push({icon:'music',title:'Mil canciones con criterio',text:'Calificaste al menos 1,000 tracks.'});
 else if(stats.trackCount>=100)result.push({icon:'music',title:'Escuchaste los detalles',text:'Cien canciones o más tienen una nota tuya.'});
 if(stats.genreCount>=20)result.push({icon:'headphones',title:'Un mapa sin fronteras',text:`Exploraste ${stats.genreCount} géneros a tu manera.`});
 if(stats.commentCount>=50)result.push({icon:'review',title:'Un año con mucho que decir',text:`Compartiste ${stats.commentCount} reseñas con comentario.`});
 if(result.length<3&&stats.longestStreak>=7)result.push({icon:'flame',title:'Una semana en el club',text:`Tu mejor racha llegó a ${stats.longestStreak} días.`});
 if(result.length<3&&stats.artists?.[0])result.push({icon:'mic',title:'Un nombre al que volviste',text:`${stats.artists[0].name} apareció en ${stats.artists[0].count} de tus reseñas.`});
 if(result.length<3&&stats.wordCount>0)result.push({icon:'chat',title:'Tu voz también hizo el año',text:`Escribiste ${Number(stats.wordCount).toLocaleString('es-MX')} palabras en tus comentarios.`});
 return result.slice(0,3);
}
