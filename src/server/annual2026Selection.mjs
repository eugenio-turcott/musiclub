// Editorial working selection. This file is imported by the authenticated server
// endpoint only; it is never embedded in the public coming-soon page.
export const RESEARCH_DATE = '2026-11-18';
export const ANNUAL_SOURCES = [
  {id:'aoty',name:'AOTY · crítica',type:'critics',url:'https://www.albumoftheyear.org/ratings/6-highest-rated/2026/1',note:'Valoraciones de crítica; no son premios.'},
  {id:'aggregate',name:'AOTY · listas anuales',type:'critics',url:'https://www.albumoftheyear.org/list/summary/2026/',note:'Agregado provisional de cuatro listas al corte. Las publicaciones incluidas no se cuentan otra vez como votos independientes.'},
  {id:'rollingstone',name:'Rolling Stone',type:'editorial',url:'https://www.rollingstone.com/music/music-lists/best-albums-of-2026-so-far-1235569912/',mirror:'https://www.albumoftheyear.org/list/2650-rolling-stones-best-albums-of-2026-so-far/',note:'Selección de mitad de año, consultada mediante el índice de AOTY; el original requiere acceso.'},
  {id:'billboard',name:'Billboard',type:'editorial',url:'https://www.billboard.com/lists/best-albums-2026-so-far/',mirror:'https://www.albumoftheyear.org/list/2656-billboards-50-best-albums-of-2026-so-far/',note:'Selección editorial de mitad de año, consultada mediante AOTY. No es el Billboard 200 ni un premio.'},
  {id:'reddit-q1',name:'Reddit · primeras selecciones',type:'community',url:'https://www.reddit.com/r/indieheads/comments/1s6gg7k/first_quarter_of_2026_your_top_5_albums_of_the/',note:'Conversación de r/indieheads; una muestra de opinión, no una encuesta representativa.'},
  {id:'reddit-june',name:'Reddit · conversación de junio',type:'community',url:'https://www.reddit.com/r/indieheads/comments/1u7ki9q/the_best_albums_of_2026_so_far/',note:'Discusión de una selección de mitad de año. No se trata como una lista editorial adicional.'},
  {id:'reddit-nov',name:'Reddit · conversación de noviembre',type:'community',url:'https://www.reddit.com/r/indieheads/comments/1xtqqyl/uncut_80_best_albums_of_2026/',note:'Comentarios sobre las primeras listas anuales; no se equiparan a premios o reseñas profesionales.'},
  {id:'grammy',name:'Recording Academy',type:'nomination',url:'https://media.grammy.net/uploads/2026/11/2027_grammys_nominations_final.pdf',note:'Nominaciones anunciadas el 16 de noviembre. Los Grammy 2027 todavía no tienen ganadores.'},
];
const item=(id,title,artist,genre,month,refs,nomination=null)=>({id,title,artist,genre,month,year:2026,refs,nomination});
// Order is editorial, not an invented consensus ranking or a Musiclub score.
export const ANNUAL_SELECTION = [
  item('phoebe','Lost Weekend','Phoebe Bridgers','Indie Folk',8,['aoty','aggregate','reddit-nov','grammy'],'Álbum del año · Grammy 2027'),
  item('raye','THIS MUSIC MAY CONTAIN HOPE.','RAYE','R&B',3,['billboard','rollingstone','grammy'],'Álbum del año · Grammy 2027'),
  item('gorillaz','The Mountain','Gorillaz','Art Pop',2,['rollingstone','aggregate','reddit-q1','grammy'],'Álbum de música alternativa · Grammy 2027'),
  item('underscores','U','underscores','Electropop',3,['billboard','reddit-june','reddit-nov']),
  item('mitski',"Nothing’s About to Happen to Me",'Mitski','Chamber Pop',2,['billboard','aggregate','reddit-q1','reddit-june']),
  item('slayyyter','WOR$T GIRL IN AMERICA','Slayyyter','Electroclash',3,['billboard','rollingstone','reddit-nov']),
  item('olivia','you seem pretty sad for a girl so in love','Olivia Rodrigo','Pop Rock',6,['billboard','rollingstone','aggregate','grammy'],'Álbum del año · Grammy 2027'),
  item('charli','Wuthering Heights','Charli xcx','Art Pop',2,['billboard','reddit-q1']),
  item('robyn','Sexistential','Robyn','Dance-Pop',3,['billboard','rollingstone']),
  item('ratboys',"Singin’ to an Empty Chair",'Ratboys','Indie Rock',2,['billboard','rollingstone','aggregate','reddit-q1']),
  item('dry-cleaning','Secret Love','Dry Cleaning','Post-Punk',1,['rollingstone','aggregate','reddit-q1']),
  item('neurosis','An Undying Love for a Burning World','Neurosis','Metal',3,['rollingstone','aggregate']),
  item('free-spirits','FREE SPIRITS','CA7RIEL & Paco Amoroso','Latin Pop',3,['billboard','reddit-q1']),
  item('rawayana','¿Dónde Es El After?','Rawayana','Latin Pop',1,['billboard','rollingstone','grammy'],'Álbum de pop latino · Grammy 2027'),
  item('vince','Cry Baby','Vince Staples','Hip-Hop',null,['aggregate','reddit-nov']),
  item('angine','Vol.II','Angine de Poitrine','Math Rock',4,['billboard','aggregate']),
];
