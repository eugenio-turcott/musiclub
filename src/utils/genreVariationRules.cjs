// Related musical objects and editorial mood cues, never an arbitrary hash.
// Existing semantic details are preserved; these palettes supply additional
// named figures when two genres would otherwise share the same composition.
const MUSIC='headphones ear volume music file-music microphone-2 choir metronome piano acousticGuitar electricGuitar bassGuitar frameDrum claves tambourine vinyl disc turntable radio device-audio-tape heart moon-stars sun leaf feather script star spiral chart-bar adjustments';
const TECH='cpu binary synthesizer piano wave-sine wave-square wave-saw-tool waves-electricity chart-bar adjustments metronome headphones ear volume radio vinyl disc turntable device-audio-tape device-speaker microphone-2 boombox device-gamepad-2 robot satellite clock atom spiral sparkles cloud moon-stars sun heart music';
const VOICE='choir message messages feather script book book-2 ear volume headphones music file-music microphone-2 metronome piano acousticGuitar harmonium frameDrum lyre heart moon-stars sun leaf clock masks-theater';
const STRINGS='acousticGuitar electricGuitar bassGuitar banjo mandolin violin cello harp lyre oud sitar zither piano harmonica microphone-2 choir metronome headphones frameDrum leaf feather heart moon-stars sun vinyl cassette';
const RHYTHM='congas maracas claves tambourine frameDrum djembe dhol cuica tabla taiko cowbells steelpan accordion bandoneon acousticGuitar bassGuitar piano trumpet trombone saxophone choir microphone-2 metronome music heart sun moon-stars';
const HEAVY='safetyPin bolt skull moon-stars hourglass crown stairs file-music leaf chevrons-right settings spiral arrows-shuffle electricGuitar bassGuitar microphone-2 frameDrum headphones metronome flame ghost shield sword atom wave-saw-tool';
const HIPHOP='boombox turntable microphone-2 device-speaker bassGuitar synthesizer piano device-audio-tape vinyl disc headphones metronome chart-bar adjustments wave-square cpu feather message building-skyscraper moon-stars sun heart flame clock';
const KEYS='piano synthesizer harmonium music file-music metronome microphone-2 choir violin cello harp lyre frameDrum headphones ear feather script book heart moon-stars sun clock';
const HERITAGE='gong metallophone angklung frameDrum cowbells flute zither sheng choir microphone-2 metronome music file-music lyre ear feather leaf sun moon-stars';
const palettes={
  synthesizer:TECH,boombox:HIPHOP,turntable:HIPHOP,'device-gamepad-2':TECH,
  'microphone-2':VOICE,choir:VOICE,feather:VOICE,script:VOICE,messages:VOICE,
  electricGuitar:STRINGS,acousticGuitar:STRINGS,bassGuitar:STRINGS,violin:STRINGS,cello:STRINGS,
  bolt:HEAVY,safetyPin:HEAVY,cassette:STRINGS,
  maracas:RHYTHM,congas:RHYTHM,djembe:RHYTHM,frameDrum:RHYTHM,tambourine:RHYTHM,
  accordion:RHYTHM,bandoneon:RHYTHM,cuica:RHYTHM,dhol:RHYTHM,steelpan:RHYTHM,
  star:VOICE+' '+TECH,heart:VOICE,flower:VOICE,lightstick:VOICE,
  saxophone:KEYS+' trumpet trombone clarinet bassGuitar',trumpet:KEYS+' trombone saxophone clarinet',
  piano:KEYS,harmonium:KEYS,'file-music':KEYS,
  gong:HERITAGE,metallophone:HERITAGE,angklung:HERITAGE,janggu:HERITAGE,sheng:HERITAGE,
  oud:STRINGS,harp:STRINGS,banjo:STRINGS,mandolin:STRINGS,zither:STRINGS,erhu:STRINGS,
  'device-speaker':HIPHOP+' trumpet trombone acousticGuitar',harmonica:STRINGS,
  'moon-stars':TECH+' leaf harp lyre',atom:TECH+' feather script',
  'masks-theater':VOICE,lyre:STRINGS,world:MUSIC,
};
const cues=[
  [/black|dark|noir|gothic/, 'moon-stars ghost'],
  [/death|brutal|gore|grind/, 'skull flame chevrons-right'],
  [/acid|psyched|cosmic/, 'spiral eye atom'],
  [/acoustic|unplugged|folk|roots|traditional/, 'acousticGuitar leaf ear'],
  [/gospel|devotional|sacred|chant|bhajan|kirtan|spiritual/, 'choir script book harmonium'],
  [/vocal|song|cant|poetry|ballad/, 'microphone-2 feather message'],
  [/melodic|love|romantic/, 'heart piano moon-stars'],
  [/dance|club|disco|house/, 'discoBall chart-bar metronome vinyl'],
  [/orchestra|symph|classic|chamber/, 'file-music violin choir metronome'],
  [/tech|electro|digital|industrial|machine/, 'cpu adjustments settings wave-square'],
  [/dub|reggae|ska/, 'device-speaker bassGuitar turntable trumpet trombone'],
  [/jazz|bebop|swing|bop/, 'piano trumpet bassGuitar metronome'],
  [/drum|beat|percussion|samba/, 'frameDrum metronome chart-bar headphones'],
  [/country|honky|western|cowboy|bluegrass/, 'banjo acousticGuitar cowboyHat harmonica'],
  [/celtic|irish|scottish/, 'harp bagpipes violin'],
  [/nu metal|rap metal/, 'turntable boombox headphones'],
  [/chicago|detroit|city|urban|memphis|london|east coast|west coast/, 'building-skyscraper radio headphones'],
  [/step|break|jungle/, 'metronome chart-bar wave-square'],
  [/gamelan|kulintang|talempong/, 'gong metallophone angklung'],
  [/samba|pagode|bossa/, 'cuica acousticGuitar frameDrum'],
  [/bhangra|jhumar|lavani|dhol/, 'dhol frameDrum choir'],
  [/doom|slow|funeral/, 'hourglass moon-stars clock'],
  [/speed|thrash|fast|hard/, 'chevrons-right flame metronome'],
];
function variationPalette(identity) {
  const preferred=[...new Set(cues.filter(([pattern])=>pattern.test(identity.key)).flatMap(([,icons])=>icons.split(' ')))];
  const pool=[...new Set([...preferred,...(palettes[identity.figure] || MUSIC).split(' ')])].filter(icon=>icon!==identity.figure);
  return {pool,preferred:new Set(preferred)};
}
function variationSignature(figure,details) {return JSON.stringify([figure,[...details].sort()]);}
module.exports={variationPalette,variationSignature};
