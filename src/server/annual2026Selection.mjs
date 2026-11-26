// Editorial working selection. This file is imported by the authenticated server
// endpoint only; it is never embedded in the public coming-soon page.
export const RESEARCH_DATE = '2026-11-26';
export const ANNUAL_SOURCES = [
  {id:'vogue',name:'Vogue · selección de 2026',type:'editorial',url:'https://www.vogue.com/article/best-albums-of-2026',note:'Selección editorial de agosto de 2026; no es un premio ni un ranking de Musiclub.'},
  {id:'aoty-jessie',name:'AOTY · Superbloom',type:'critics',url:'https://www.albumoftheyear.org/album/1655621-jessie-ware-superbloom.php',note:'Reseñas y datos del release; no se presentan como un premio.'},
  {id:'aoty-harry',name:'AOTY · Kiss All The Time.',type:'critics',url:'https://www.albumoftheyear.org/album/1617971-harry-styles-kiss-all-the-time-disco-occasionally.php',note:'Reseñas y datos del release; no se presentan como un premio.'},
  {id:'aoty-fcukers',name:'AOTY · Ö',type:'critics',url:'https://www.albumoftheyear.org/album/1614963-fcukers-o.php',note:'Reseñas y datos del release; no se presentan como un premio.'},
  {id:'aoty-haute',name:'AOTY · Big Disgrace',type:'critics',url:'https://www.albumoftheyear.org/album/1608911-haute-freddy-big-disgrace.php',note:'Reseñas y datos del release; no se presentan como un premio.'},
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
// Musiclub editorial ranking: first is #1. Club review scores are separate statistics.
export const ANNUAL_SELECTION = [
  {
    "id": "raye",
    "title": "THIS MUSIC MAY CONTAIN HOPE.",
    "artist": "Raye",
    "genre": "R&B",
    "year": 2026,
    "releaseDate": "2026-03-27",
    "month": 3,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum del año · Grammy 2027"
  },
  {
    "id": "rosalia",
    "title": "LUX (Complete Works)",
    "artist": "ROSALÍA",
    "genre": "Alternativo",
    "year": 2026,
    "releaseDate": "2026-04-16",
    "month": 4,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum del año · Grammy 2027"
  },
  {
    "id": "olivia",
    "title": "you seem pretty sad for a girl so in love",
    "artist": "Olivia Rodrigo",
    "genre": "Pop",
    "year": 2026,
    "releaseDate": "2026-06-12",
    "month": 6,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum del año · Grammy 2027"
  },
  {
    "id": "phoebe",
    "title": "Lost Weekend",
    "artist": "Phoebe Bridgers",
    "genre": "Folk",
    "year": 2026,
    "releaseDate": "2026-08-14",
    "month": 8,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum del año · Grammy 2027"
  },
  {
    "id": "bruno",
    "title": "The Romantic",
    "artist": "Bruno Mars",
    "genre": "R&B",
    "year": 2026,
    "releaseDate": "2026-02-27",
    "month": 2,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum del año · Grammy 2027"
  },
  {
    "id": "olivia-dean",
    "title": "The Art of Loving",
    "artist": "Olivia Dean",
    "genre": "Pop",
    "year": 2025,
    "releaseDate": "2025-09-26",
    "month": 9,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum del año · Grammy 2027"
  },
  {
    "id": "ella",
    "title": "Dandelion",
    "artist": "Ella Langley",
    "genre": "Country",
    "year": 2026,
    "releaseDate": "2026-01-30",
    "month": 1,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum del año · Grammy 2027"
  },
  {
    "id": "taylor",
    "title": "The Life of a Showgirl",
    "artist": "Taylor Swift",
    "genre": "Pop",
    "year": 2025,
    "releaseDate": "2025-10-03",
    "month": 10,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum del año · Grammy 2027"
  },
  {
    "id": "ariana",
    "title": "petal",
    "artist": "Ariana Grande",
    "genre": "Pop",
    "year": 2026,
    "releaseDate": "2026-07-31",
    "month": 7,
    "refs": [
      "grammy"
    ],
    "nomination": "Álbum vocal pop · Grammy 2027"
  },
  {
    "id": "geese",
    "title": "Getting Killed",
    "artist": "Geese",
    "genre": "Indie Rock",
    "year": 2025,
    "releaseDate": "2025-09-26",
    "month": 9,
    "refs": [
      "grammy"
    ],
    "nomination": "Artista nuevo · Música alternativa · Grammy 2027"
  },
  {
    "id": "slayyyter",
    "title": "WOR$T GIRL IN AMERICA",
    "artist": "Slayyyter",
    "genre": "Synth-Pop",
    "year": 2026,
    "releaseDate": "2026-03-27",
    "month": 3,
    "refs": [
      "grammy"
    ],
    "nomination": "Artista nuevo · Dance/electrónica · Grammy 2027"
  },
  {
    "id": "angine",
    "title": "Vol.II",
    "artist": "Angine de Poitrine",
    "genre": "Pop",
    "year": 2026,
    "releaseDate": "2026-04-03",
    "month": 4,
    "refs": [
      "grammy"
    ],
    "nomination": "Artista nuevo · Interpretación rock · Grammy 2027"
  },
  {
    "id": "don-toliver",
    "title": "OCTANE",
    "artist": "Don Toliver",
    "genre": "Hip-Hop",
    "year": 2026,
    "releaseDate": "2026-01-30",
    "month": 1,
    "refs": [
      "grammy"
    ],
    "nomination": "Artista nuevo · Rap · Grammy 2027"
  },
  {
    "id": "leon-thomas",
    "title": "PHOLKS",
    "artist": "Leon Thomas",
    "genre": "R&B",
    "year": 2025,
    "releaseDate": "2025-10-23",
    "month": 10,
    "refs": [
      "grammy"
    ],
    "nomination": "R&B progresivo · Grammy 2027"
  },
  {
    "id": "madonna",
    "title": "CONFESSIONS II",
    "artist": "Madonna",
    "genre": "Pop",
    "year": 2026,
    "releaseDate": "2026-07-03",
    "month": 7,
    "refs": [
      "grammy"
    ],
    "nomination": "Dance/electrónica · Grammy 2027"
  },
  {
    "id": "laufey",
    "title": "A Matter of Time: The Final Hour",
    "artist": "Laufey",
    "genre": "Pop",
    "year": 2026,
    "releaseDate": "2026-04-09",
    "month": 4,
    "refs": [
      "grammy"
    ],
    "nomination": "Interpretación vocal pop tradicional · Grammy 2027"
  },
  {
    "id": "kacey",
    "title": "Middle of Nowhere",
    "artist": "Kacey Musgraves",
    "genre": "Pop",
    "year": 2026,
    "releaseDate": "2026-04-17",
    "month": 4,
    "refs": [
      "grammy"
    ],
    "nomination": "Country contemporáneo · Grammy 2027"
  },
  {
    "id": "karol-g",
    "title": "NO ME ARREPIENTO DE SENTIR TANTO",
    "artist": "KAROL G",
    "genre": "Reggaetón",
    "year": 2026,
    "releaseDate": "2026-08-07",
    "month": 8,
    "refs": [
      "grammy"
    ],
    "nomination": "Pop latino · Grammy 2027"
  },
  {
    "id": "ive",
    "title": "REVIVE+",
    "artist": "IVE",
    "genre": "K-Pop",
    "year": 2026,
    "releaseDate": "2026-02-23",
    "month": 2,
    "refs": [
      "grammy"
    ],
    "nomination": "Interpretación de pop asiático · Grammy 2027"
  },
  {
    "id": "asake",
    "title": "M$NEY",
    "artist": "Asake",
    "genre": "Afrobeats",
    "year": 2026,
    "releaseDate": "2026-04-30",
    "month": 4,
    "refs": [
      "grammy"
    ],
    "nomination": "Interpretación de música africana · Grammy 2027"
  }
];
