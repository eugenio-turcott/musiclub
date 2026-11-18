// Original vector compositions for the annual edition. No image-generation service.
// Keep each drawing as editable paths, strokes and flat inks for web and design tools.
import fs from 'node:fs/promises';
const dir=new URL('../public/annual/2026/art/',import.meta.url);
await fs.mkdir(dir,{recursive:true});
const ink='#28232e',paper='#eee6d5',rose='#c66e91',mint='#86b5a7',gold='#d3ac63';
const stroke=extra=>`${/\bstroke=/.test(extra)?'':`stroke="${ink}"`} ${/\bstroke-width=/.test(extra)?'':'stroke-width="2.3"'}`;
const path=(d,fill='none',extra='')=>`<path d="${d}" fill="${fill}" ${stroke(extra)} stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const ellipse=(cx,cy,rx,ry,fill=paper,extra='')=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${stroke(extra)} ${extra}/>`;
const hatch=(x,y,w,h,gap=10)=>Array.from({length:Math.ceil(w/gap)},(_,i)=>path(`M${x+i*gap} ${y}l-${Math.min(18,h/3)} ${h}`,'none','opacity=".23" stroke-width="1"')).join('');
const stars=(points)=>points.map(([x,y,s=8])=>path(`M${x} ${y-s}q0 ${s} ${s} ${s}q-${s} 0 -${s} ${s}q0 -${s} -${s} -${s}q${s} 0 ${s} -${s}`,gold)).join('');
const leaf=(x,y,r=0,s=1)=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${path('M0 0C-35-4-46-39-39-63C-12-54 8-26 0 0Z',mint)}${path('M0 0-31-50M-13-19-31-21M-22-34-22-49','none','stroke-width="1.5"')}</g>`;
const grooves=(cx,cy,r)=>Array.from({length:17},(_,i)=>ellipse(cx,cy,r-i*3,r-i*3,'none','stroke-width=".8" opacity=".45"')).join('');
const defs=`<defs><pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".55" fill="${ink}" opacity=".25"/></pattern><pattern id="lines" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 0V8" stroke="${ink}" stroke-width="1" opacity=".2"/></pattern></defs>`;
const frame=(body,title,h=560)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 ${h}" role="img"><title>${title}</title>${defs}<path fill="${paper}" d="M0 0h440v${h}H0z"/>${body}<path fill="url(#dots)" opacity=".34" d="M0 0h440v${h}H0z"/><path d="M12 13 427 11 429 ${h-13} 11 ${h-11}Z" fill="none" stroke="${ink}" stroke-width="2"/></svg>`;
const drawings={
  'tormenta':frame(
    path('M22 23H417V538H22Z',mint)+
    path('M45 43 387 42 391 400 43 403Z',paper)+path('M60 58H372V387H60Z',ink)+
    path('M65 171Q109 108 153 158T242 147T366 156V383H65Z',rose)+
    path('M66 197Q114 151 164 199T271 185T368 207M67 222Q112 193 174 227T286 219T368 234M67 250Q122 217 181 253T301 247T368 259','none','stroke="#eee6d5" stroke-width="1.4"')+
    path('M220 64 194 141 222 128 197 207 255 104 223 113 249 65Z',gold)+
    stars([[98,92,6],[329,84,8],[293,128,5]])+
    path('M50 538Q55 486 101 458L160 421 191 365Q198 351 207 359Q213 364 210 377L199 412 225 386Q237 375 243 384Q248 393 238 404L213 430 240 410Q255 401 260 411Q264 420 251 431L231 446 250 438Q268 432 271 443Q273 451 255 460L209 484 163 495 140 538Z',paper)+
    path('M417 538 382 470Q365 453 338 441L294 420Q284 417 279 425Q275 433 287 442L314 459 280 450Q265 447 263 458Q262 468 279 472L309 482 279 479Q265 479 265 490Q267 499 282 501L322 505 350 538Z',paper)+
    path('M104 461Q143 472 163 495M131 445Q164 457 177 475M340 442 323 505M352 450 337 512')+
    path('M40 285Q80 267 114 292T189 286T275 296T395 282L394 320Q348 337 307 313T214 326T126 316T40 330Z',rose)+
    path('M44 302Q82 284 115 306T190 303T277 312T390 299','none','stroke="#eee6d5" stroke-width="1.3"')+
    hatch(57,505,75,25), 'Ventana de tormenta, manos y cinta de seda'),
  'gato':frame(
    path('M23 23H417V538H23Z',rose)+path('M52 44H388V330H52Z',ink)+
    path('M64 57H205V313H64ZM218 57H376V313H218Z',mint)+
    path('M68 245Q111 192 144 221T201 229V309H68ZM221 240Q259 208 292 240T373 212V309H221Z',paper)+
    path('M80 111 137 72 182 117M244 104 291 68 344 107','none','stroke="#eee6d5" stroke-width="1.3"')+
    ellipse(325,135,24,24,gold)+
    path('M106 414Q98 346 116 257L94 173 161 203Q214 185 266 203L332 172 313 261Q338 345 309 416Z',paper)+
    path('M108 211 113 184 144 211M283 211 313 186 307 220',rose)+
    path('M125 269Q149 248 176 270Q154 295 127 275ZM249 270Q274 248 298 270Q273 294 250 275Z',mint)+
    ellipse(153,272,5,13,ink)+ellipse(273,271,5,13,ink)+
    path('M202 304 223 304 214 318Z',rose)+path('M214 319V332Q198 344 185 330M214 332Q228 344 242 331M141 312 84 301M141 324 81 327M282 310 339 300M282 324 343 330')+
    path('M150 354Q167 376 178 407M277 353Q260 373 251 405M161 203 174 231M265 204 252 231M188 196 191 229M233 197 230 229')+
    path('M51 412H390V454H51ZM68 455H373V493H68ZM48 495H392V528H48Z',gold)+
    path('M78 421H359M83 443H367M93 466H350M89 482H351M73 505H365M71 517H362','none','stroke-width="1.2"')+
    leaf(68,414,-30,.9)+leaf(371,414,65,1)+
    hatch(116,364,36,43), 'Un gato en la ventana, libros y plantas'),
  'montana':frame(
    path('M23 23H417V617H23Z',mint)+ellipse(271,151,93,93,gold)+
    Array.from({length:18},(_,i)=>{const a=i*Math.PI/9;return path(`M${271+101*Math.cos(a)} ${151+101*Math.sin(a)}l${17*Math.cos(a)} ${17*Math.sin(a)}`,'none','stroke-width="1.5"');}).join('')+
    path('M24 421 99 307 145 352 218 199 284 304 323 276 417 414V617H24Z',rose)+
    path('M24 493 103 395 145 425 215 277 267 387 315 352 416 462V617H24Z',paper)+
    path('M24 551 100 459 156 492 214 369 278 475 331 438 416 539V617H24Z',ink)+
    path('M215 277 215 369M218 199 204 267M104 395 104 459M278 475 267 387M331 438 315 352','none','stroke-width="1.4"')+
    path('M76 601 101 568 143 568 167 541 200 541 221 510 253 510 278 478','none','stroke="#eee6d5" stroke-width="3"')+
    [90,161,243,305].map((x,i)=>`<g transform="translate(${x} ${558-i*15})">${ellipse(0,-39,7,8,paper)}${path('M-7-28Q1-35 8-26L12-4-9-3Z',i%2?rose:mint)}${path('M-4-2-8 20M6-2 11 20M-8-23-16-8M8-22 18-12','none','stroke="#eee6d5" stroke-width="2"')}</g>`).join('')+
    path('M42 89Q76 66 104 92T161 89M293 287Q336 264 388 290','none','stroke-width="1.3"')+stars([[75,165,8],[376,77,6]]), 'Montañas, un sol grabado y cuatro caminantes',640),
  'silla':frame(
    path('M23 23H417V497H23Z',gold)+path('M24 333 153 264 416 334V497H24Z',rose)+
    path('M24 333 416 334M76 307V27M366 309V28M137 497 185 334M312 497 266 334M24 423H417','none','stroke-width="1.3"')+
    path('M167 119Q207 110 257 119L264 280 161 282Z',mint)+path('M177 133Q211 126 247 133L249 236 174 239Z',paper)+
    path('M160 276 263 277 290 317 139 317Z',paper)+path('M150 318 140 426M279 318 297 424M168 321 174 394M257 320 254 394','none','stroke-width="7"')+
    ellipse(216,453,108,18,ink,'opacity=".15"')+
    path('M167 118Q138 99 147 79Q153 64 165 76Q178 51 191 66Q205 52 218 67Q232 52 246 67Q271 62 270 85Q290 107 257 121',rose)+
    leaf(92,330,-15,.8)+path('M91 330 85 394M76 395H109L103 439H81Z',mint)+
    path('M319 73 349 73 343 127 324 127Z',paper)+ellipse(334,73,16,5,gold)+path('M334 126V169M316 169H352'), 'Una silla vacía en una habitación con flores',520),
  'teatro':frame(
    path('M23 23H417V597H23Z',ink)+ellipse(222,315,117,171,gold)+
    path('M23 23H168Q132 95 152 172Q169 243 112 290L66 313 23 466Z',rose)+
    path('M417 23H283Q320 96 298 173Q279 246 340 291L381 317 417 464Z',rose)+
    path('M48 32Q80 153 48 266M80 30Q111 134 76 269M117 30Q142 123 112 252M390 33Q359 158 391 267M356 29Q326 132 360 271M319 31Q295 131 324 255','none','stroke-width="1.6"')+
    path('M24 470Q218 413 416 469V597H24Z',paper)+path('M24 508Q218 450 416 507M24 548Q218 486 416 547M24 585Q218 524 416 584','none','stroke-width="1.4"')+
    ellipse(221,290,28,37,paper)+path('M194 289Q186 259 207 245Q239 234 250 267L248 284 234 262 202 278Z',ink)+
    path('M194 322Q218 336 246 320L272 422Q214 445 167 419Z',mint)+path('M204 335 198 404M231 335 242 406','none','stroke-width="1.2"')+
    path('M192 331 160 366 133 347M248 330 273 356 288 324','none','stroke-width="9"')+
    path('M219 420 207 470M237 420 245 469','none','stroke-width="8"')+
    path('M294 275V464M280 465H308','none','stroke-width="3"')+ellipse(294,269,9,17,paper)+
    stars([[214,109,9],[161,198,6],[282,170,8]])+hatch(31,478,60,93), 'Un escenario con cortinas y una cantante',620),
  'flores':frame(
    path('M23 23H417V497H23Z',mint)+path('M54 280Q213 245 388 279L378 455Q221 478 66 454Z',paper)+
    path('M71 292H367V333H71Z',gold)+Array.from({length:14},(_,i)=>path(`M${81+i*21} 297V327`,'none','stroke-width="1"')).join('')+
    ellipse(164,391,42,42,ink)+grooves(164,391,35)+ellipse(164,391,12,12,rose)+ellipse(300,388,39,39,rose)+grooves(300,388,31)+
    path('M95 267 78 144M126 263 158 157M207 258 213 117M276 262 291 145M340 268 366 171','none','stroke-width="4"')+
    [[78,136,rose],[159,147,paper],[213,105,gold],[292,137,rose],[369,159,paper]].map(([x,y,c],i)=>`<g transform="translate(${x} ${y}) rotate(${i*13})">${Array.from({length:7},(_,j)=>ellipse(0,-24,12,23,c,`transform="rotate(${j*51.4})"`)).join('')}${ellipse(0,0,16,16,ink)}${ellipse(0,0,7,7,gold)}</g>`).join('')+
    leaf(110,229,90,.75)+leaf(213,213,-20,.85)+leaf(302,240,75,.9)+
    path('M77 459 72 481M363 457 370 481','none','stroke-width="7"')+stars([[56,236,6],[354,69,8]]), 'Una radio de la que crecen flores',520),
  'arbol':frame(
    path('M23 23H417V617H23Z',paper)+ellipse(219,253,166,181,rose)+
    path('M204 586Q217 498 199 422L174 362 156 301 112 246 99 180 137 227 161 239 163 181 143 137 173 159 187 209 192 284 212 315 228 238 252 193 261 129 273 166 270 214 245 265 247 324 283 288 312 254 325 199 331 251 314 291 281 331 255 377 239 431Q225 501 248 585Z',ink)+
    path('M215 579Q233 505 214 425M214 426 197 357M227 407 240 353M207 346 180 280M237 349 279 311','none','stroke="#eee6d5" stroke-width="1.2"')+
    [ [105,173,-25],[144,134,10],[164,174,60],[259,122,60],[326,192,70],[309,249,110],[110,244,-10] ].map(([x,y,r])=>leaf(x,y,r,.9)).join('')+
    path('M24 588Q111 550 212 586T416 583M25 607Q116 573 209 603T416 602','none','stroke-width="1.4"')+
    ellipse(95,80,21,21,gold)+stars([[349,87,7],[70,381,7],[368,438,5]])+
    Array.from({length:10},(_,i)=>path(`M${49+i*38} ${474+i%3*16}q-12 22 2 43`,'none','stroke-width="1.1"')).join(''), 'Un árbol de ramas grabadas y un sol pequeño',640),
  'carta':frame(
    path('M23 23H417V497H23Z',rose)+
    path('M64 128 280 75 347 349 129 404Z',paper)+
    path('M92 150 261 109M98 173 268 132M105 197 272 156M112 220 279 180','none','stroke-width="1" opacity=".6"')+
    path('M67 280 343 231 389 425 103 475Z',gold)+path('M68 282 233 351 343 234M104 474 199 336M389 426 266 346','none','stroke-width="2"')+
    path('M227 377C188 350 201 320 223 325Q237 308 252 325C274 351 250 370 227 377Z',rose)+
    path('M49 60Q110 38 147 77T239 70T391 72L390 103Q313 126 266 96T163 109T49 93Z',mint)+
    path('M52 77Q112 59 148 92T242 87T388 86','none','stroke-width="1.2"')+
    leaf(66,439,-10,.85)+stars([[370,177,10],[104,246,6],[301,425,7]])+
    path('M178 252Q188 229 207 239Q211 214 232 226Q247 209 263 231','none','stroke-width="2"'), 'Cartas, un corazón de cera y una cinta',520),
  'vinilo':frame(
    path('M23 23H417V537H23Z',gold)+
    ellipse(221,279,157,157,ink)+grooves(221,279,148)+ellipse(221,279,81,81,mint)+ellipse(221,279,9,9,paper)+
    path('M141 247Q175 213 219 201L221 270Z',rose)+path('M244 354 224 290 290 321Z',rose)+
    path('M157 305Q199 278 228 313T291 299','none','stroke-width="1.5"')+
    path('M42 86Q85 111 105 79Q124 48 144 78M296 68Q332 37 355 71Q373 98 400 73','none','stroke-width="2"')+
    path('M54 440Q98 419 140 452T231 445T326 458T399 442','none','stroke-width="3"')+
    path('M54 455Q101 434 141 467T231 460T327 473T400 457','none','stroke-width="1.1"')+
    stars([[61,187,9],[370,355,11],[212,72,10],[78,355,5],[340,169,7]])+
    path('M350 483 376 483 376 504 348 504Z',mint)+path('M350 483 340 472M375 482 386 470'), 'Un vinilo entre estrellas y ondas dibujadas'),
};
for(const [name,svg] of Object.entries(drawings))await fs.writeFile(new URL(`${name}.svg`,dir),svg);
console.log(`Prepared ${Object.keys(drawings).length} original annual drawings.`);
