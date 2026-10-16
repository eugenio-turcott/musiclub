import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
const outcomes = [];
async function check(path, verify, options = {}) {
  const response = await fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(60000), ...options });
  const body = await response.text();
  try { verify(response, body); } catch (error) { throw new Error(`${path}: ${error.message.split('\n')[0]}`); }
  outcomes.push({ path, status: response.status });
}
for (const path of ['/', '/catalogo', '/catalogo?page=2', '/reviews', '/artista/blood-incantation', '/albumes/blood-incantation-absolute-elsewhere']) {
  await check(path, (r, text) => {
    assert.equal(r.status, 200, path);
    assert.match(text, /<h1[\s>]/, path + ' has a server-rendered H1');
    assert.match(text, /href="\/(albumes|eps|sencillos|artista)\//, path + ' links to music');
    assert.ok(!text.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING'), path + ' avoids CSR bailout');
    assert.ok(!text.includes('reviewer_email'), path + ' has no private review fields');
  });
}
for (const path of ['/albumes/absolute-elsewhere', '/albumes/Mundo-Retorcido']) {
  await check(path, r => { assert.equal(r.status, 308); assert.match(r.headers.get('location'), /\/albumes\/[^/]+-[^/]+/); });
}
await check('/albumes/auditoria-musiclub-inexistente-20261016', r => assert.equal(r.status, 404));
await check('/catalogo?page=99999', r => assert.equal(r.status, 404));
for (const path of ['/sitemap.xml','/sitemap-core.xml','/sitemap-reviews.xml','/sitemap-catalog.xml','/sitemap-artists.xml']) {
  await check(path, (r, xml) => {
    assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /xml/);
    const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
    assert.equal(new Set(urls).size, urls.length, path + ' has unique URLs');
    assert.ok(!urls.some(u=>u.endsWith('/artista/')));
    if(path.includes('catalog')||path.includes('reviews')) assert.ok(urls.every(u=>decodeURIComponent(new URL(u).pathname).split('/').pop()===decodeURIComponent(new URL(u).pathname).split('/').pop().toLowerCase()));
  });
}
for (const path of ['/api/albums/enrich','/api/notifications/recommendation','/api/notifications/upcoming',
  '/api/notifications/pool-winner','/api/notifications/pool-graduated','/api/notifications/patch-notes','/api/catalog']) {
  await check(path, r=>assert.equal(r.status,401), { method:'POST', headers:{'Content-Type':'application/json'},body:'{}' });
}
await check('/api/notifications/upcoming/check-releases', r=>assert.equal(r.status,401));
await check('/api/spotify?path=https://example.com', r=>assert.equal(r.status,400));
await check('/api/catalog', (r,text)=>{assert.equal(r.status,200);assert.ok(!text.includes('reviewer_email'));assert.ok(!text.includes('added_by_email'));});
console.log(JSON.stringify({ passed: outcomes.length, outcomes },null,2));
if (fs.existsSync('audit')) fs.writeFileSync('audit/v96-smoke-results.json',JSON.stringify(outcomes,null,2));
