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
});
