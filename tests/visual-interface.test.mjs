import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import swc from 'next/dist/build/swc/index.js';
await swc.loadBindings();
async function component(relative, name) {
  const url = new URL(relative, import.meta.url);
  const compiled = await swc.transform(fs.readFileSync(url, 'utf8'), {filename:url.pathname,jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const module = {exports:{}};
  new Function('require','module','exports',compiled.code)(createRequire(url),module,module.exports);
  return module.exports[name];
}
const Gauge = await component('../src/components/ScoreGauge.jsx','ScoreGauge');
const Label = await component('../src/components/UiIcon.jsx','InterfaceText');
test('the score gauge distinguishes missing scores from zero and bounds imported values', () => {
  const missing = renderToStaticMarkup(React.createElement(Gauge,{value:null}));
  const zero = renderToStaticMarkup(React.createElement(Gauge,{value:0}));
  assert.match(missing,/sin calificar/); assert.match(zero,/0\.00 de 10/);
  const high = renderToStaticMarkup(React.createElement(Gauge,{value:12}));
  assert.match(high,/10\.00 de 10/); assert.match(high,/stroke-dasharray="100 100"/);
  assert.match(high,/hsl\(120 72% 52%\)/);
  assert.match(zero,/hsl\(0 72% 52%\)/);
});
test('interface labels render vector icons while keeping their descriptive text and ordinary symbols', () => {
  const html = renderToStaticMarkup(React.createElement(Label,null,'🎧 Ver álbum · © Musiclub'));
  assert.match(html,/<svg/);assert.match(html,/stroke-width="1\.8"/);
  assert.match(html,/Ver álbum · © Musiclub/);assert.doesNotMatch(html,/🎧/);
  const boundary = renderToStaticMarkup(React.createElement('span',null,React.createElement(Label,null,'♫ Temporada '),'1'));
  assert.match(boundary,/<\/span> 1<\/span>/);
});


test('different interface symbols have unique artwork and key destinations have distinct identities', () => {
  const require=createRequire(import.meta.url);
  const {GLYPH_ICONS}=require('../src/utils/interfaceIcons.cjs');
  const {ICON_BODIES,ICON_COLORS}=require('../src/utils/interfaceArtwork.cjs');
  const normalized=new Map(),drawings=new Set();
  for(const [glyph,name] of Object.entries(GLYPH_ICONS)){
    const canonical=glyph.replaceAll('\uFE0F','');
    if(normalized.has(canonical)) continue;
    normalized.set(canonical,name);
    assert.ok(ICON_BODIES[name],`Missing drawing for ${glyph}`);
    assert.ok(ICON_COLORS[name],`Missing color for ${glyph}`);
    assert.ok(!drawings.has(ICON_BODIES[name]),`Repeated drawing for ${glyph}: ${name}`);
    drawings.add(ICON_BODIES[name]);
  }
  assert.notEqual(ICON_BODIES.pool,ICON_BODIES.gashapon);
  assert.notEqual(ICON_BODIES.settings,ICON_BODIES.admin);
});

test('interface symbols used by pages and controls all have an explicit drawing', () => {
  const require=createRequire(import.meta.url);
  const {GLYPH_ICONS}=require('../src/utils/interfaceIcons.cjs');
  const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(new URL(entry.name+'/',dir)):[new URL(entry.name,dir)]);
  const files=[...walk(new URL('../src/components/',import.meta.url)),...walk(new URL('../src/views/',import.meta.url)),new URL('../src/utils/badgeSystem.js',import.meta.url),new URL('../src/utils/ratingUtils.js',import.meta.url)];
  const expression=/\p{Extended_Pictographic}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])?)*/gu;
  for(const file of files.filter(url=>/\.(jsx|js)$/.test(url.pathname)&&!/WhatsAppEmojiPicker|ReviewInteractions/.test(url.pathname))){
    for(const match of fs.readFileSync(file,'utf8').matchAll(expression)){
      if(['©','®','™'].includes(match[0]))continue;
      assert.ok(GLYPH_ICONS[match[0]],`Missing explicit interface icon for ${match[0]} in ${file.pathname}`);
    }
  }
});
