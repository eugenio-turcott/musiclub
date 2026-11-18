// Original cut-paper interpretations of actual releases, always square editable vectors.
import fs from 'node:fs/promises';
import {ANNUAL_ART} from '../src/data/annual2026Art.mjs';
import {ANNUAL_SELECTION} from '../src/server/annual2026Selection.mjs';
const dir=new URL('../public/annual/2026/art/',import.meta.url);
await fs.mkdir(dir,{recursive:true});
const ink='#221e36',cream='#f5efdd',pink='#f078a9',red='#d84a67',mint='#8ed9bc',blue='#6bc8de',gold='#f0c66c';
const p=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const line=(d,color=cream,w=3)=>p(d,'none',`stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`);
const grooves=(x,y,r,color=cream)=>Array.from({length:9},(_,i)=>circle(x,y,r-i*6,'none',`stroke="${color}" stroke-width="1.2" opacity=".27"`)).join('');
const sparkle=(x,y,size=13,color=gold)=>p(`M${x} ${y-size}Q${x+2} ${y-2} ${x+size} ${y}Q${x+2} ${y+2} ${x} ${y+size}Q${x-2} ${y+2} ${x-size} ${y}Q${x-2} ${y-2} ${x} ${y-size}`,color);
const leaf=(x,y,angle=0,color=mint,scale=1)=>`<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${p('M0 0C-60 4-69-48-45-84C-8-66 18-29 0 0Z',color)}${line('M0 0-35-61',ink,2)}</g>`;
const defs=`<defs><pattern id="grain" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".65" fill="${ink}" opacity=".13"/><circle cx="7" cy="8" r=".4" fill="${cream}" opacity=".28"/></pattern><filter id="cut" x="-20%" y="-20%" width="145%" height="145%"><feDropShadow dx="0" dy="8" stdDeviation="0" flood-color="${ink}" flood-opacity=".16"/></filter></defs>`;
const cut=body=>`<g filter="url(#cut)">${body}</g>`;
const art=(id,bg,body)=>{const r=ANNUAL_ART.find(r=>r.id===id);return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img"><title>${r.title.replaceAll('&','&amp;')} · ${r.artist.replaceAll('&','&amp;')}</title><desc>${r.description}</desc>${defs}${p('M0 0H600V600H0Z',bg)}${body}${p('M0 0H600V600H0Z','url(#grain)')}</svg>`;};
const drawings={
  charli:art('charli','#ba627d',
    p('M0 0H235L170 600H0Z','#8d4363')+p('M425 0H600V600H483Z','#d8909e')+circle(454,103,126,pink)+grooves(454,103,116,ink)+
    cut(p('M75 338Q263 280 518 337L557 493Q300 565 47 489Z','#7c8d8a')+p('M92 351Q292 302 501 352L511 439Q297 491 75 437Z',cream)+p('M110 365Q295 328 481 365L490 422Q301 465 96 421Z',blue))+
    line('M121 382Q207 355 282 385T464 383M121 409Q210 380 291 411T465 407',cream,3)+
    cut(p('M302 0 378 0 382 240Q375 291 333 354L301 384 226 382Q208 369 225 358L278 332 307 245Z','#e6b8a3'))+
    p('M335 0 378 0 382 240Q368 293 335 340L309 344 333 247Z','#c98c86')+
    cut(p('M552 70 600 81 591 286Q574 335 506 356L468 361Q448 351 463 338L520 314 551 270Z','#955d68'))+
    p('M194 600 231 476 275 425 286 376Q290 360 302 367Q310 371 307 385L301 421 327 402Q339 396 344 405Q348 412 337 423L315 439 346 431Q362 430 361 442Q360 452 343 456L307 468 280 499 267 600Z',cream)+
    cut(p('M132 212Q150 203 170 212L164 271Q154 294 139 273Z',gold)+line('M151 286V326M130 326H171',ink,4))+sparkle(101,119,14,cream)+sparkle(466,522,11,gold)),
  mitski:art('mitski','#b2c78b',
    Array.from({length:7},(_,i)=>line(`M${25+i*90} 0V600`,'#7d9f77',2)).join('')+
    [[54,135],[531,145],[78,504],[515,488],[300,54]].map(([x,y],i)=>leaf(x,y,i*66,'#8ca976',.75)).join('')+circle(305,320,222,blue)+grooves(305,320,211,cream)+
    cut(p('M77 600Q67 492 129 407L148 221 119 81 242 148Q310 129 376 149L490 74 462 225 482 409Q539 494 528 600Z',cream))+
    p('M143 115 166 210 218 164Z','#edb2bd')+p('M465 110 388 165 442 204Z','#edb2bd')+
    p('M134 340Q184 278 258 326Q209 382 141 351Z',ink)+p('M342 326Q406 275 461 338L450 350Q394 382 342 326Z',ink)+
    circle(204,333,30,gold)+circle(399,332,30,blue)+p('M204 308Q192 331 204 357Q218 335 204 308Z',ink)+p('M398 306Q386 330 398 356Q412 331 398 306Z',ink)+circle(213,324,6,cream)+circle(407,323,6,cream)+
    p('M278 391Q300 382 323 391L301 413Z',pink)+line('M301 411V438Q276 459 255 435M301 438Q323 459 347 435',ink,3)+line('M235 403 83 377M235 421 77 430M365 402 522 375M365 421 531 429',ink,2)+
    p('M243 169 257 235 266 167ZM303 161 314 238 326 163ZM362 171 367 234 389 181Z','#d7d8c9')),
  gorillaz:art('gorillaz','#efd38a',
    circle(435,131,151,'#e9a35c')+grooves(435,131,140,ink)+p('M0 192Q57 142 108 185T219 176T341 188T472 178T600 188V600H0Z','#7bb3b4')+p('M0 329Q63 275 132 321T260 318T398 315T600 301V600H0Z','#467d86')+
    cut(p('M41 600 187 397 226 402 313 183 387 320 430 302 581 600Z',ink))+p('M313 183 314 348 227 404 243 483 149 600H41L187 397 226 402Z','#4c556a')+p('M313 183 387 320 361 310 346 290 321 315 300 307 280 335Z',cream)+p('M296 351 370 328 420 377 360 413 290 408Z',gold)+
    [[280,332,pink],[326,302,blue],[366,327,mint],[410,360,red]].map(([x,y,c],i)=>`<g transform="translate(${x} ${y}) rotate(${[-11,5,-5,10][i]})">${circle(0,-35,9,cream)}${p('M-12-21 9-21 15 14-15 14Z',c)}${line('M-7 12-13 40M9 12 19 39M-11-17-27-2M10-17 24-7',cream,4)}</g>`).join('')+
    line('M209 433 246 465 219 500 270 523 244 557 292 600',gold,4)+p('M0 468Q53 434 99 462T188 468L150 493Q103 476 70 500T0 511Z',mint)+sparkle(91,79,13,cream)),
  raye:art('raye','#394969',
    circle(299,263,226,'#526681')+grooves(299,263,217,'#aac3ce')+p('M0 0H209Q170 50 211 99Q234 145 172 180Q192 217 117 238Q121 290 43 307L0 292Z','#222a47')+p('M600 0H399Q449 64 402 112Q375 156 437 186Q412 246 489 262Q472 310 600 336Z','#20263f')+
    cut(p('M315 80 477 80 477 267 315 267Z',gold)+p('M325 91 466 91 466 255 325 255Z',cream)+p('M315 80 401 111 401 283 315 267Z','#7e92ad'))+circle(382,190,4,gold)+p('M0 493Q150 464 297 489T600 486V600H0Z','#a6b988')+line('M126 479 347 200',gold,3)+
    cut(circle(127,395,19,'#d4a190')+p('M109 410Q133 421 150 414L177 502Q128 527 90 503Z',red)+p('M110 410 102 462 76 476 67 463 87 444Z',red)+p('M147 414 174 442 201 421 207 435 176 462 148 441Z',pink))+
    line('M115 507 106 553M147 508 157 552',ink,7)+line('M99 554H119M150 554H171',ink,5)+[[225,354],[445,383],[325,448],[79,146]].map(([x,y])=>sparkle(x,y,8,gold)).join('')),
  slayyyter:art('slayyyter',blue,
    circle(409,132,159,'#a5ddea')+grooves(409,132,148,cream)+p('M0 467Q160 398 293 472T600 466V600H0Z','#8fb6cd')+
    cut(p('M347 35 479 21 560 212 525 408 347 401 315 210Z',ink)+p('M367 157 463 127 491 407 348 424Z',cream)+p('M347 392 491 386 515 521 349 544Z','#b8d9e2'))+p('M407 0H491L511 92 469 121 401 89Z','#e4b79f')+p('M0 379 60 299 144 278 194 354 199 493 44 533 0 477Z','#9ad9e6')+
    cut(circle(94,287,65,ink)+p('M33 224Q98 170 162 220L157 269 24 269Z',red)+p('M22 268Q86 247 174 263L198 282 22 283Z',red)+p('M63 214 132 214 137 253 59 253Z',cream))+
    p('M70 220H128V226H70ZM69 232H116V238H69ZM69 244H129V249H69Z',ink)+cut(circle(267,304,88,red)+circle(267,304,69,blue))+line('M293 267Q253 245 244 272Q236 292 271 301Q304 310 290 333Q277 353 244 337M267 246V360',red,9)+
    p('M63 389 120 365 152 436 135 469 83 463Z',ink)+p('M92 400 119 387 137 424 117 437Z',gold)+sparkle(526,538,17,cream)),
  robyn:art('robyn','#222437',
    circle(302,310,239,pink)+grooves(302,310,227,cream)+
    cut(p('M97 600 121 371 163 303 170 226 155 127 176 61 208 51 217 70 195 147 219 242 220 307 272 340 362 330 401 269 413 195 384 92 390 49 414 45 430 77 450 181 459 274 434 350 478 600Z','#e9c4a8'))+p('M231 333Q301 377 368 333L418 600H178Z',mint)+
    cut(p('M229 210Q271 158 332 185Q390 217 363 287L332 332 273 327 236 289Z','#ebc2a5'))+p('M222 229Q195 182 237 151L268 126 281 155 324 137 330 158 365 158 376 192 348 230 307 212 267 228Z',gold)+p('M247 181 270 153 279 184 322 158 316 190 356 182 339 205 302 194 266 209Z',cream)+
    p('M271 248Q284 236 299 248ZM320 247Q335 233 346 248Z',ink)+p('M275 280Q305 267 337 279Q322 315 299 306Z',ink)+p('M285 280H327L320 291 290 290Z',cream)+line('M292 241 287 260M319 241 323 259',ink,3)+sparkle(101,214,20,blue)+sparkle(487,369,15,gold)+sparkle(481,98,10,cream)),
  ratboys:art('ratboys','#c6dfac',
    circle(310,290,190,cream)+grooves(310,290,182,'#8db696')+p('M0 0H600V127Q511 78 479 172Q409 138 370 192Q309 133 254 181Q183 137 142 212Q81 177 0 237Z','#476b67')+p('M0 0H600V63Q511 32 469 104Q387 70 339 130Q268 81 211 131Q127 92 79 154L0 154Z',mint)+p('M0 269 73 298 44 600H0ZM600 258 535 297 559 600H600Z','#264e53')+
    leaf(118,191,48,'#76ad87',1.4)+leaf(475,190,120,mint,1.4)+leaf(89,425,35,mint,1.25)+leaf(525,439,110,'#76ad87',1.3)+p('M0 531Q122 468 274 502T600 518V600H0Z','#89b980')+line('M196 127 218 392M278 141 298 392M331 146 330 395M411 128 409 395','#b07567',4)+
    cut(p('M203 388H312V409H203Z',red)+p('M315 391H426V412H315Z',red))+line('M216 397H297M330 400H413',gold,2)+[[104,503],[457,536],[517,488],[180,552],[390,574]].map(([x,y])=>line(`M${x} ${y+16}V${y-8}`,'#476b67',2)+circle(x,y-10,5,pink)).join('')),
  'free-spirits':art('free-spirits',cream,
    p('M0 0H300V300H0Z','#e9c0d6')+p('M300 0H600V300H300Z','#b7d9c9')+p('M0 300H300V600H0Z','#a7cddb')+p('M300 300H600V600H300Z','#f2d591')+
    [[0,0,ink,'#b592c1'],[300,0,'#cfb6a1','#eee9de'],[0,300,gold,'#eee9de'],[300,300,ink,'#b7b9d2']].map(([x,y,hair,shirt],i)=>`<g transform="translate(${x} ${y})">${grooves(150,147,132,ink)}${cut(p('M34 300 69 237 113 223 184 223 231 243 268 300Z',shirt)+p('M129 200H173V241H129Z','#d8ab98')+p('M88 107Q93 56 151 58Q208 57 215 111L203 181Q186 221 152 223Q113 220 97 179Z','#e9c5ae'))}${p(i%2?'M86 118Q62 80 95 56L145 37 211 57 225 103 205 128 185 87 149 95 111 86 104 124Z':'M83 118 75 81 104 49 126 53 144 32 166 53 191 49 225 91 212 129 189 94 166 103 145 88 117 104 98 95Z',hair)}${p('M111 143Q126 137 138 143L138 148H112ZM163 143Q178 137 190 144L190 149H163Z',ink)}${line('M151 145 145 171 156 173M133 190Q151 198 173 190',ink,2)}${p('M113 228 150 248 127 268 100 247ZM185 227 150 248 174 267 201 246Z',ink)}${circle(151,250,8,shirt)}</g>`).join('')),
  olivia:art('olivia','#78b6d0',
    circle(449,459,153,'#acd5df')+grooves(449,459,144,ink)+line('M72 0 187 227M351 0 320 225',ink,3)+
    Array.from({length:9},(_,i)=>`<g transform="translate(${75+i*12} ${10+i*24}) rotate(-25)">${p('M-4-9Q4-13 7-5L9 6Q8 13 1 10L-3 6Z','none',`stroke="${cream}" stroke-width="2"`)}</g>`).join('')+
    cut(p('M177 220 317 215 325 238 182 243Z',gold)+p('M208 222 219 112 254 54 279 59 275 82 245 132 249 227Z','#e8baa5')+p('M277 224 316 142 347 126 377 141 365 164 343 163 311 245Z','#e8baa5')+p('M248 59 265 19 286 26 280 66Z',cream)+p('M342 125 359 110 398 132 385 156 366 152Z',ink)+p('M195 244 303 235 346 371 317 425 221 414 179 352Z',pink)+p('M224 254 291 248 302 355 270 388 205 351Z','#f5a3b7')+p('M194 264 164 315 185 381 173 393 140 322 165 264Z','#e8baa5')+p('M304 249 349 281 378 334 363 344 333 298 300 280Z','#e8baa5')+circle(271,440,44,'#e8baa5'))+
    p('M228 423Q219 450 206 478L187 493 219 505 211 526 246 510 268 532 285 511 307 531 309 506 338 507 319 475 309 425 292 456 253 459Z',ink)+p('M246 426Q267 415 292 425L287 438 251 440Z',ink)+sparkle(438,116,16,cream)+sparkle(98,444,12,gold)),
};
for(const piece of ANNUAL_ART){
  const release=ANNUAL_SELECTION.find(r=>r.id===piece.id);
  if(!release||release.title!==piece.title||release.artist!==piece.artist)throw new Error(`Art must match the annual selection: ${piece.id}`);
  await fs.writeFile(new URL(`${piece.id}.svg`,dir),drawings[piece.id]);
}
console.log(`Prepared ${ANNUAL_ART.length} square release illustrations.`);
