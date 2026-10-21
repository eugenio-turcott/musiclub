// Visual associations are editorial metaphors, not claims about instrumentation.
// Specific objects take precedence over the broad legacy visual families.
const catalog = require('./genreCatalog.cjs');
const {genreFamily} = require('./genreFamilies.cjs');
const library = require('../data/musicIconLibrary.json');
const overrides = require('../data/genreVisualOverrides.json');
const FAMILY_ICONS = {pop:'star',rock:'electricGuitar',hiphop:'boombox',rnb:'heart',soul:'microphone-2',electronic:'synthesizer',jazz:'saxophone',metal:'bolt',punk:'safetyPin',folk:'acousticGuitar',classical:'violin',latin:'maracas',regional:'accordion',reggaeton:'congas',indie:'cassette',country:'cowboyHat',ambient:'moon-stars',reggae:'device-speaker',dance:'discoBall',funk:'bassGuitar',blues:'harmonica',kpop:'lightstick',jpop:'flower',experimental:'atom',arabic:'oud',world:'world'};
const primary = new Set('pop|rock|hip hop|r&b|soul|electronic|jazz|metal|punk|folk|classical|latin|regional mexicano|reggaeton|indie|alternative|country|ambient|reggae|disco|dance|funk|blues|k-pop|j-pop|experimental|arabic music|world'.split('|'));
const exact = (names) => new Set(names.split('|'));
const associations = [
  ['angklung', /angklung/], ['gong', /gamelan/], ['metallophone', /kulintang|talempong|timbila/],
  ['janggu', /gugak|^(aak|dangak|hyangak|jeongak|sanjo|sinawi|pungmul|muak|pansori|gagok)$/],
  ['sheng', /^(gagaku|yanyue|yayue)$/], ['erhu', /sizhu|guoyue|guangdong yinyue|chaozhou xianshi|nanguan|baisha xiyue|dongjing/],
  ['zither', /^(koto|sōkyoku|kumiuta|jiuta|meiji shinkyoku|chinese literati music|kacapi suling|tembang cianjuran|tarawangsa)$/],
  ['shamisen', /shamisen|jamisen|^(nagauta|kouta|jōruri|heikyoku|rōkyoku|shinkyoku)$/],
  ['tabla', /^(dhrupad|khyal|thumri|tappa|tarana|natya sangeet|danmono|hindustani|carnatic|klasik)$/],
  ['harmonium', /^(bhajan|kirtan|shabad kirtan|abhang|qawwali|kafi|ginan|stotra|nagara naam)$/],
  ['sitar', /sitar|raga|sitarsploitation/], ['oud', /maqam|muqam|mugham|malouf|malhun|falak|sufiana|islamic modal/],
  ['bagpipes', /bagad|pipe band|pìobaireachd/], ['panFlute', /^(sikuri|huayno|huaylarsh|yaraví|sanjuanito|carnavalito|chuscada|chimayche|huayno con arpa)$/],
  ['bandoneon', /tango|milonga/], ['castanets', /flamenco|bulería|sevillanas|seguidilla|^(jota|saeta|fandango)$/],
  ['accordion', /^(cajun|zydeco|nouveau zydeco|vallenato|forró|forró universitário|forró eletrônico|forró de favela|famo|funnel|funaná|trikitixa|chamame|chamamé|chamamé tropical|norteño|duranguense|tejano|tex-mex|narodnozabavna glasba|ländlermusik|musette)$/],
  ['steelpan', /^(calypso|calipso venezolano|calipso|soca|power soca|bashment soca|chutney soca|steel band|spouge|mento|goombay|shanto|biguine|cadence lypso)$/],
  ['berimbau', /^(capoeira|berimbau)$/], ['cuica', /samba|pagode|pagodão|partido alto/],
  ['claves', /^(son cubano|son montuno|songo|timba|guaguancó|descarga|changüí|charanga|danzón|chachachá|mambo|pachanga|rumba|guaracha)$/],
  ['tambourine', /^(afoxê|ijexá|batucada|maracatu|baião|coco|ciranda|xaxado|xote|maxixe|marchinha|carimbó|batuque|jongo|lundu)$/],
  ['djembe', /^(agbadza|agbekor|apala|assiko|benga|bikutsi|dùndún|fuji|gondang|gwo ka|griot|kadodi|kete|mbalax|mataali|ngoma|takamba|tassa|zinli|ziglibithy|kilapanga|kadongo kamu|mchiriku|tchinkoumé|ngoma|zema|liwa|boduberu)$/],
  ['mbira', /^(chimurenga|mbira|kalindula|sungura)$/], ['taiko', /taiko|urumi melam|dhol tasha/],
  ['frameDrum', /^(ahwash|aita|algerian chaabi|moroccan chaabi|gnawa|bendir|dabke|samri|sa'idi|sawt|bedoui wahrani|staïfi|raï|izlan|fijiri)$/],
  ['choir', /chant|choral|choir|^(a cappella|barbershop|close harmony|isicathamiya|mbube|klapa|paghjella|sutartinės|seto leelo|trallalero|cantu a tenore|dongzu dage|himene tarava|sacred harp|polifonia occitana|beompae|shōmyō|taizé chant)$/],
  ['microphone-2', /^(adhan|nasheed|maddahi|mantra|menzuma|chazzanut|baqashot|maftirim|piyyut|nigun|zemirot|mappila|kakawin|njup|njuup|sticheron|troparion|kontakion|sutra|shoor|konnakol|beatboxing|yodeling|whistling|white voice|central asian throat singing|urtiin duu|bogino duu|uzun hava|bozlak|joik|yukar)$/],
  ['harp', /harp|^(celtic|celtic new age|celtic chant)$/], ['banjo', /bluegrass|^(old-time|jamgrass|skiffle|jug band|american primitive guitar)$/],
  ['violin', /fiddling|^(polka|chicago polka|eastern-style polka|polka paraguaya|polca criolla|mazurka|oberek|kujawiak|krakowiak|csárdás|verbunkos|schottische|hambo|humppa|klezmer|guggenmusik|gaita zuliana)$/],
  ['piano', /^(ragtime|classic ragtime|ragtime song|stride|novelty piano|boogie-woogie|étude|nocturne|impromptu|prelude|toccata|character piece|bagatelle|capriccio)$/],
  ['file-music', /^(cantata|concerto|concerto for orchestra|concerto grosso|choral symphony|oratorio|overture|requiem|mass|motet|madrigal|fugue|sonata|symphony|string quartet|sinfonia concertante|symphonic poem|theme and variations|ricercar|serenade|divertissement|fantasia|concert spiritual|canzona|art song|lied|mélodie|lauda|parlour music|spiritual art song|singspiel|operetta|opéra comique|romantische oper|zarzuela|zarzuela barroca|zeitoper|verismo|généro chico|género chico|género grande)$/],
  ['lyre', /^(ars antiqua|ars nova|ars subtilior|renaissance|medieval|lute song|minnesang|troubadour song|medieval lyric poetry|contenance angloise)$/],
  ['masks-theater', /ballet|cabaret|vaudeville|revue|music hall|musical$|^(noh|kunqu|quyi|cải lương|chèo|hát tuồng|comédie-ballet|burrakatha|sketch comedy|kabarett)$/],
  ['feather', /poetry|^(spoken word|canto a lo poeta|payada|repente|cantoria|canzone d'autore|chanson à texte|nova cançó|nueva canción|nueva trova|nuevo cancionero|trouva|trova|trova yucateca|música de intervenção|canto cardenche|cowboy poetry|ngâm thơ)$/],
  ['messages', /^(interview|audio documentary|audio drama|speech|lecture|sermon|prank calls|comedy|standup comedy)$/],
  ['ear', /^(asmr|binaural beats|guided meditation|non-music)$/], ['cloud-rain', /^(rain sounds|nature sounds|field recording|animal sounds|birdsong|whale song)$/],
  ['ship', /^(sea shanty|rabbit song|work song|waulking song|puirt à beul|fishermen's song)$/],
  ['ball-football', /football chant/], ['christmas-tree', /christmas|villancico|colindă/], ['balloon', /children's music|lullaby|fairy tale/],
  ['trumpet', /brass|march|^(dechovka|frevo|frevo de rua|frevo de bloco|frevo-canção|frevo elétrico|música festera|concert band|pep band|dixieland|big band|dobrado|doble paso|pasodoble|tanjidor)$/],
  ['saxophone', /^(hard bop|neo-bop|post-bop|third stream|modern creative|birmingham sound|cape jazz|paramaribop|kréyol djaz)$/],
  ['device-gamepad-2', /chip|bit music|nintendocore|amigacore|bytebeat|black midi/], ['turntable', /turntablism|battle record|plunderphonics|sampledelia|chopped and screwed/],
  ['boombox', /grime|phonk|plugg|hyphy|jerk$|crunk|horrorcore|nerdcore|chopper|dirty south|mobb music|miami bass|houston sound|chicago bop|chap hop|hipco|hiplife|genge|bongo flava|hanmai|ratchet music|rage$|snap$|britcore/],
  ['safetyPin', /^(oi|d-beat|uk82|powerviolence|queercore|riot grrrl|screamo|thrashcore|stenchcore|neocrust|blackened crust|burning spirits|cuddlecore|easycore)$/],
  ['bolt', /^(nwobhm|thall|neue deutsche härte|neue deutsche todeskunst|blackgaze|death 'n' roll|black 'n' roll|mincecore|crossover thrash)$/],
  ['cassette', /^(c86|slowcore|dunedin sound|dunedin|dunosti sound|madchester|hamburger schule|paisley underground|shitgaze|grebo|no wave|group sounds|mod|mod revival)$/],
  ['electricGuitar', /^(aor|glam|heavy psych|jam band|zeuhl|zolo|brutal prog|avant-prog|crossover prog|symphonic prog|progressive|psychobilly|merseybeat|nederbeat|freakbeat|hot rod music|surf|vocal surf|eleki|rautalanka|beat music|jovem guarda|yé-yé|nashville sound|bakersfield sound|red dirt|urban cowboy|western)$/],
  ['star', /kayō|idol|denpa|moe song|ryūkōka|shidaiqu|shinkyoku|trot$|k-pop|j-pop|yakousei|akishibu|nyū myūjikku|opm$|opm |manila sound|brill building|tin pan alley|beach music|schlager|partyschlager|dansband|dansktop|estrada|schlager|rigsar|brega|música cebolla|canción melódica|laiko|manele|chalga|tallava|rabiz|muzika|muzikat|laïkó|música criolla|filmi|fantezi|arabesk/],
  ['synthesizer', /core$|step$|wave$|tek$|tekno|rave|hardstyle|rawstyle|rawphoric|full-on|nitzhonot|suomisaundi|zenonesque|eurobeat|hi-nrg|hi-tech|hardbag|donk|makina|bass|bounce|gqom|amapiano|afropiano|kuduro|kwaito|singeli|batida|bubbling|budots|manyao|footwork|juke$|jersey|baltimore|philly club|deconstructed club|club$|weightless|wonky|glitch|algorave|acousmatic|autonomic|eai$|onkyo|lowercase|data sonification|microsound|spectralism|serialism|minimalism|stochastic|sonorism|process music|expressionism|futurism|indeterminacy|totalism|new complexity|neoclassicism|impressionism|holy minimalism|english pastoral school|sound art|sound collage|sound effects|tape music|musique|drift phonk|dungeon sound|hauntology|nortec|tbm$|darkcore|dariacore|crossbreed|complextro|coldwave|broken transmission|exotica|lounge|downtempo|easy listening|cocktail nation|barber beats|psybient|chillstep|kankyō ongaku|moogsploitation/],
  ['congas', /^(dembow|neoperreo|cubatón|reparto|rkt|bachatón|dennery segment|shatta|baila|boogaloo|bomba|bomba del chota|plena|punta|palo de mayo|tumba|tumba francesa|tumbélé|cadence rampa|compas|cabo zouk|afro-zouk|zouk|zouk love|kizomba|tarraxinha|semba|séga|séga tambour|seggae|morna|coladeira|maloya|maloya électronique|maloya élektrik|moutya|mgodro|festejo|landó|bullerengue|currulao|candombe|candombe beat|saya afroboliviana)$/],
  ['acousticGuitar', /^(sertanejo|sertanejo raiz|sertanejo romântico|sertanejo universitário|agronejo|moda de viola|arrocha sertanejo|música llanera|joropo|carranga|son jarocho|son huasteco|son calentano|son istmeño|trova yucateca|choro|mpb|tropicália|tropicanibalismo|udigrudi|nova cançó|nueva canción chilena|nueva canción española|canzone napoletana|canzone neomelodica|chanson française|chanson québécoise|chanson réaliste|liedermacher|levenslied|kleinkunst|filk|nueva trova|cantoria|cantu a chiterra|baul gaan|baithak gana|qaraami|kadongo kamu|omutibo|palm-wine|soukous|kwassa kwassa|highlife|burger-highlife|guitarrada|mugithi|tsapiky|marrabenta|makossa|sungura|salegy)$/],
];
const extra = [
  ['synthesizer',exact('acholitronix|aggrotech|balani show|balearic beat|beat bolha|beat bruxaria|beat fino|berlin school|big beat|briddim|broken beat|changa tuki|cruise|deep tech|digital fusion|dubstyle|eccojams|epic collage|extratone|free car music|freestyle|future riddim|gabber|ghettotech|halftime|hands up|hard beat|hard nrg|hard renaissance|hardtekk|hardvapour|hexd|illbient|j-euro|jump up|jumpstyle|jungle|jungle dutch|jungle terror|leftfield|lento violento|liquid riddim|livetronica|lowend|mallsoft|minatory|moombahton|neue deutsche welle|neurohop|new beat|nu style gabber|nustyle|outrun|powerstomp|psystyle|purple sound|ragga jungle|rasteirinha|reductionism|regalia|rominimal|schranz|sigilkore|skizzo|skweee|slowed & reverb|tamborzão|tearout|tread|twerk|uk jackin|utopian virtual|wa euro|xtra raw|ytpmv')],
  ['microphone-2',exact('biraha|burmese mono|burmese stereo|ca trù|chöd|copla|copla cajamarquina|cuplé|desgarrada|dhaanto|embolada|enka|éntekhno|gaelic psalm singing|gstanzl|gufeng|instrumental|kai|kantan chamorrita|military cadence|mūsīqā lubnāniyya|neo kyma|özgün müzik|pala|passion setting|powada|qasidah modern|quan họ|ring shout|rizitika|sean-nós|seresta|stornello|tân cổ giao duyên|toada de boi|tonada asturiana|tonadilla|visa|vocalese|waka|xẩm|zhongguo feng')],
  ['acousticGuitar',exact('avanzada|chilena|cururu|fandango caiçara|filipino rondalla|jit|kalon\'ny fahiny|keroncong|malagueña venezolana|modinha|música típica chilena|néo-trad|nepali lok geet|parang|phleng phuea chiwit|punto|rasqueado cuiabano|rhumba|rustic stomp|scrumpy and western|stomp and holler|trampská hudba|twoubadou|wong shadow|yu-mex')],
  ['congas',exact('afrobeats|afrobeat|bélé|bend-skin|beni|caporal|chakacha|champeta|conga|coupé-décalé|deejay|guaracha santiagueña|guayla|habanera|kapuka|mad|morenada|muliza|murga|murga uruguaya|pandilla|ragga|taquirari|xuc')],
  ['accordion',exact('bandinha|concertina band|grupera|morenada|movimiento alterado|new mexico music|pimba|ripsaw|sierreño|vanera|volkstümliche musik|waila')],
  ['violin',exact('čalgija|contra|dimotiko|hornpipe|mulatós|rebetiko|skiladiko|vaigat|zeybek')],
  ['electricGuitar',exact('canterbury scene|donosti sound|gothic|pigfuck|psichedelia occulta italiana|psychedelic|psychploitation|xian psych')],
  ['star',exact('al jeel')],['heart',exact('alté')],['device-speaker',exact('2 tone|dubwise')],
  ['bolt',exact('doomgaze')],['gong',exact('change ringing|gambang kromong|kliningan|kuda lumping|pinpeat|piphat')],
  ['flute',exact('cilokaq|fon leb|kagura|khrueang sai|mahori|rom kbach')],
  ['taiko',exact('kumi-daiko|ogene music')],['masks-theater',exact('cakewalk|monodrama')],
  ['script',exact('coon song|minstrelsy')],['vinyl',exact('porn groove|boogie')],
  ['pedalSteel',exact('sacred steel')],['cowbells',exact('ogene music')],['music',exact('instrumental')],['oud',exact('orkes gambus')],['piano',exact('onda nueva|tiento')],
  ['atom',exact('conducted improvisation|free improvisation')],['file-music',exact('jácara|production music')],
  ['boombox',exact('ragga hip-hop')],
  ['maracas',exact('axé|brega calypso|lambada|carimbó|porro|pilón|merecumbé|merequetengue|méringue|merengue|cuarteto|tecnobrega|piseiro|arrocha|arrochadeira|batidão romântico|cachaca|chicha|mambo chileno|mambo urbano|tribal guarachero|son nica|son de pascua|tamborera|tamborito|bambuco|chacarera|zamba|zamacueca|cueca|cueca brava|marinera|marinera norteña|tondero|pasillo|vals criollo|vals venezolano|valsa brasileira|tonada potosina|huapango|guajira|guarania|chamarrita açoriana|chamarrita rioplatense|chotis madrileño|isa|tajaraste|sardana|muiñeira|tarantella|tammurriata|pizzica|liscio|waltz|slow waltz|polonaise|krakowiak|hambo|benna|junkanoo|rara|rasin|bouyon|zess|shanto|fungi|sigidrigi|vude|fakaseasea|ʻōteʻa|ori deck|bantengan|jaipongan|ketuk tilu|koplo|dangdut|campursari|langgam jawa|kantruem|mor lam|mor lam sing|luk thung|luk krung|sarala gee|bhangra|lavani|garba|jhumar|gaana|dohori|dondang sayang|dikir barat|dhol tasha|chutney|chutney soca|kaneka|jawaiian|hapa haole|slack-key guitar|tarraxinha|ritmada|gommance|zoblazo|zouglou|zouk|gumbe|alloukou|ambasse bey|mangambeu|mangue beat|mbolé|muziki wa dansi|township jive|township bubblegum|mbaqanga|kwela|go-go|gqom|bacardi|banga|kidandali|kidumbak|soukous|santé engagé|tradi-moderne congolais|tradi-moderne ivoirien|tchinkoumé|aleke|kaseko|kasékò|puxa|rkt')],
  ['microphone-2',exact('ghazal|dhrupad|mélodie|sevdalinka|doina|russian romance|russian chanson|bocet|boedra|adhunik geet|bhavageethe|jibonmukhi gaan|balitaw|kundiman|harana|kanto|morna|tizita|bozlak|harawi|pirekua|canto degli alpini|cante alentejano|għana|izlan|ahwash|ashkenazi cantorial music|islamic religious music|contemporary christian|church music|praise & worship|spirituals|red song|red dirt|nhạc đỏ|nhạc tiền chiến|nhạc vàng|runo song|min\'yō|shima-uta|ondō|shan\'ge|haozi|wangga|djanba|unakesa|unyago|kalattut|uaajeerneq|tivaner inngernerlu|rabbit song|saluang klasik|kakawin|kecak|kete|duma|nóta|fado|fado de coimbra|filin|sawt|batonebi songs|iavnana|aboio|baguala|pásztordal|lullaby|drinking song|fahrtenlied|football chant|jùjú|jesus music|jubilee|doo-wop|quiet storm|motown|minneapolis sound|sissy bounce|soft visual|loud kei|visual kei|palingsound|nyū myūjikku|zohioliin duu|sarala gee|tassu|meyxana|ngâm thơ|russian orthodox liturgical music|vedic chant|tibetan buddhist chant|taoist ritual music')],
];
const MODIFIERS = [
  ['atmospheric',/atmospheric|ambient|ethereal|dream|shoegaze/,'cloud'],
  ['black',/black|dark|gothic|noir/,'moon-stars'],['death',/death|grind/,'skull'],
  ['doom',/doom|slow|funeral/,'hourglass'],['power',/power|epic|royal/,'crown'],
  ['progressive',/progressive|math|technical/,'stairs'],['symphonic',/symphonic|orchestral|chamber|baroque/,'file-music'],
  ['folk',/folk|acoustic|traditional/,'leaf'],['speed',/thrash|speed|hard|heavy|fast/,'chevrons-right'],
  ['industrial',/industrial|machine|cyber/,'settings'],['psychedelic',/psyched|acid|space|cosmic/,'spiral'],
  ['fusion',/fusion|crossover|mixed/,'arrows-shuffle'],['minimal',/minimal|micro|lo-fi/,'minus'],
  ['dance',/dance|house|techno|club|disco/,'chart-bar'],['soul',/soul|romantic|ballad|love/,'heart'],
  ['electronic',/electro|digital|synth|tech|tronic/,'cpu'],['live',/live|concert/,'microphone-2'],
  ['vocal',/vocal|song|chant|cant|gospel|spiritual/,'message'],['instrumental',/instrumental/,'music'],
  ['new',/neo-|new |future|modern/,'sparkles'],['retro',/old|retro|classic|vintage|revival/,'clock'],
  ['jazz',/jazz|bop|swing/,'saxophone'],['rock',/rock/,'electricGuitar'],['pop',/pop/,'star'],
  ['hiphop',/hip.?hop|rap|trap/,'boombox'],['reggae',/reggae|ska|dub/,'device-speaker'],
];
function genreIdentity(raw) {
  const key=catalog.genreKey(raw); if(!key) return null;
  const family=genreFamily(key);
  const association=associations.find(([icon,pattern])=>pattern.test(key) && !(icon==='synthesizer' && ['metal','punk','rock','hiphop'].includes(family)));
  const additional=extra.find(([,members])=>members.has(key));
  const override=overrides[key];
  const figure=override?.figure || (primary.has(key) ? FAMILY_ICONS[family] : null) || association?.[0] || additional?.[0] || FAMILY_ICONS[family] || 'lyre';
  const quality=association || additional ? 'specific' : FAMILY_ICONS[family] ? 'family' : 'general';
  const details=override?.details || (primary.has(key) ? [] : MODIFIERS.filter(([,pattern,icon])=>icon!==figure && pattern.test(key)).slice(0,2).map(([id,,icon])=>({id,icon,label:library.icons[icon].label})));
  // The default is an explicitly general musical metaphor, never a fabricated
  // instrument attribution or an abstract polygon selected by a hash.
  if(!details.length && quality==='general') details.push({id:'tradition',icon:'compass',label:'Brújula'});
  return {key,family,figure,label:library.icons[figure].label,details,quality,
    note:quality==='general' ? 'Lira como metáfora musical general; no afirma que el género utilice este instrumento.' : 'Asociación visual editorial; no representa toda la instrumentación del género.'};
}
module.exports={genreIdentity,FAMILY_ICONS,MODIFIERS};
