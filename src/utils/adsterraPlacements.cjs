// Public placement identifiers obtained from Musiclub's Adsterra dashboard.
// Popunder/Onclick and Smartlink intentionally have no integration here.
const BANNERS = Object.freeze({
  rectangle: {id:'32010329',key:'6dee051ac3e169e1b746a4c2e8cc927f',width:300,height:250},
  medium: {id:'32055934',key:'dbf7f4128e2d6822b335199900a7e4a9',width:468,height:60},
  compactTower: {id:'32055935',key:'b92ef93198aa67a924031f99228448aa',width:160,height:300},
  tower: {id:'32055936',key:'33c8156b5eddd3100681006d6203e055',width:160,height:600},
  mobile: {id:'32055937',key:'7490a54a6799b7b975f1a6e8775eb81d',width:320,height:50},
  wide: {id:'32055938',key:'3ecad5bb8fd608f2d32d944a89405f46',width:728,height:90},
});
const NATIVE = {id:'31067204',key:'0b1f8e88620f4f682b83e40675c39376',src:'https://pl31167703.profitableratecpmnetwork.com/0b1f8e88620f4f682b83e40675c39376/invoke.js'};

function horizontalBanner(width) {
  return [BANNERS.wide,BANNERS.medium,BANNERS.mobile,BANNERS.rectangle].find(banner=>width>=banner.width) || null;
}
function verticalBanner(width,height) {
  if(width<1000) return null;
  return height>=900 ? BANNERS.tower : BANNERS.compactTower;
}
function bannerDocument(banner) {
  if(!Object.values(BANNERS).includes(banner)) throw new Error('Unknown advertising placement');
  const options=JSON.stringify({key:banner.key,format:'iframe',height:banner.height,width:banner.width,params:{}});
  // The vendor consumes then deletes window.atOptions in strict mode. A global
  // `var` makes it non-configurable and stops rendering with a TypeError.
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script>window.atOptions=${options};</script><script src="https://bicea.org/22/${banner.key}"></script></body></html>`;
}
module.exports={BANNERS,NATIVE,horizontalBanner,verticalBanner,bannerDocument};
