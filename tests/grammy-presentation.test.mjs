import test from 'node:test';
import assert from 'node:assert/strict';
import {browseGrammyCategories} from '../src/utils/grammyPresentation.mjs';
import {GRAMMY_CATEGORIES,GRAMMY_FIELDS} from '../src/data/grammys2027.mjs';

test('inline ballot prioritizes General, exposes all fields and preserves official order',()=>{
  const browse=options=>browseGrammyCategories(GRAMMY_CATEGORIES,{},GRAMMY_FIELDS,options);
  assert.equal(browse().length,6);
  assert.equal(browse({field:'new'}).length,5);
  assert.equal(browse({field:'all'}).length,100);
  for(const field of GRAMMY_FIELDS)assert.ok(browse({field:field.id}).every(c=>c.field===field.id));
  assert.deepEqual(browse({field:'all'}).map(c=>c.order),[...GRAMMY_CATEGORIES].sort((a,b)=>a.order-b.order).map(c=>c.order));
});

test('search finds nominee titles and artists across fields, ignoring case and accents',()=>{
  const groups={'album-of-the-year':[{title:'Un álbum azul',artist:'Artista Único'}]};
  const browse=query=>browseGrammyCategories(GRAMMY_CATEGORIES,groups,GRAMMY_FIELDS,{field:'new',query});
  assert.deepEqual(browse('ARTISTA unico').map(c=>c.id),['album-of-the-year']);
  assert.deepEqual(browse('album azul').map(c=>c.id),['album-of-the-year']);
  assert.ok(browse('Album of the Year').some(c=>c.id==='album-of-the-year'));
  assert.equal(browse('does-not-exist').length,0);
  assert.equal(groups['album-of-the-year'][0].title,'Un álbum azul');
});
