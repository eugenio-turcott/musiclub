// Nine deliberately public art spoilers; the full editorial collection stays server-side.
export const ANNUAL_ART = [
  {id:'charli',title:'Wuthering Heights',artist:'Charli xcx',description:'Una copa, agua y manos sobre una fuente de piedra.'},
  {id:'mitski',title:'Nothing’s About to Happen to Me',artist:'Mitski',description:'Un gato blanco con un ojo dorado y otro azul, frente a un papel floral.'},
  {id:'gorillaz',title:'The Mountain',artist:'Gorillaz',description:'Cuatro figuras sobre una montaña, entre nubes y un sol de vinilo.'},
  {id:'raye',title:'THIS MUSIC MAY CONTAIN HOPE.',artist:'RAYE',description:'Una figura vestida de rojo abre una puerta luminosa entre nubes.'},
  {id:'slayyyter',title:'WOR$T GIRL IN AMERICA',artist:'Slayyyter',description:'Una gorra roja, prendas azules y un símbolo rojo sobre un cielo claro.'},
  {id:'robyn',title:'Sexistential',artist:'Robyn',description:'Una figura de cabello rubio baila con los brazos levantados.'},
  {id:'ratboys',title:'Singin’ to an Empty Chair',artist:'Ratboys',description:'Dos columpios rojos en un claro, bajo un dosel de árboles.'},
  {id:'free-spirits',title:'FREE SPIRITS',artist:'CA7RIEL & Paco Amoroso',description:'Cuatro retratos geométricos en una composición de dos por dos.'},
  {id:'olivia',title:'you seem pretty sad for a girl so in love',artist:'Olivia Rodrigo',description:'Una figura con vestido rosa se balancea de cabeza sobre el cielo.'},
].map(piece=>({...piece,src:`/annual/2026/art/${piece.id}.svg`}));
