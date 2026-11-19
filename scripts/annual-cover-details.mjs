// Defining cover symbols need their own contours: colour clustering cannot
// preserve thin ink on a nearly white sign. Coordinates follow the local cover.
export function coverIdentityDetails(id){
  if(id!=='underscores')return '';
  return `<g data-cover-detail="underscores-u" transform="scale(.9375)"><path transform="translate(250 220) scale(.2)" d="M560 420L565 345L560 245L540 190L505 118L470 57L436 54L405 62L385 82L370 133L355 218L360 279L376 320L397 337L421 340L446 328L468 303L485 268L495 233L520 286L529 339L528 432L515 485L496 529L457 557L404 579L346 597L280 595L234 584L197 565L168 529L145 482L132 430L134 367L149 313L178 236L184 296L201 337L229 360L256 366L284 357L306 329L321 287L324 224L313 162L298 111L285 88L244 88L200 92L162 109L139 137L115 182L105 230L101 299L100 374L107 451L125 514L152 561L188 597L231 623L281 639L333 641L390 629L444 610L484 586L515 553L540 513L554 469L560 420Z" fill="none" stroke="#4b4c46" stroke-width="7.5" stroke-linejoin="round" stroke-linecap="round"/></g>`;
}
