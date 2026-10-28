import { test, expect } from '@playwright/test';
const user = { id: '00000000-0000-4000-8000-000000000081', email: 'member@example.test', user_metadata: { full_name: 'Miembro de Prueba' }, app_metadata: { provider: 'google' }, aud: 'authenticated', created_at: '2026-10-27T00:00:00Z' };

async function libraryAccount(page) {
  const rows = [];
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.addInitScript(user => {
    const payload = btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.fixture-only`, refresh_token: 'fixture-only', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }));
  }, user);
  await page.route('**/auth/v1/user', route => route.fulfill({ json: user }));
  await page.route('**/rest/v1/profiles*', route => route.fulfill({ json: { ...user, name: 'Miembro de Prueba', role: 'user' } }));
  await page.route('**/rest/v1/user_release_preferences*', route => route.fulfill({ json: rows }));
  await page.route('**/rest/v1/rpc/musiclub_set_release_preference', route => {
    const input = route.request().postDataJSON();
    let row = rows.find(row => row.release_key === input.p_release_key);
    if (!row) { row = { user_id: user.id, release_key: input.p_release_key, release: input.p_release, listen_later: false, gashapon_dismissed: false }; rows.push(row); }
    row[input.p_action] = input.p_value;
    if (input.p_value) row[input.p_action === 'listen_later' ? 'saved_at' : 'dismissed_at'] = new Date().toISOString();
    return route.fulfill({ json: row });
  });
  return rows;
}

test('listen later saves from a card without navigating, survives reload and can be removed from the profile', async ({ page }) => {
  await libraryAccount(page);
  await page.goto('/catalogo?q=Azul');
  const card = page.locator('[data-catalog-release]');
  await card.getByRole('button', { name: 'Escuchar más tarde: Azul', exact: true }).click();
  await expect(page).toHaveURL(/\/catalogo/);
  await expect(card.getByRole('button', { name: 'Quitar de Escuchar más tarde: Azul', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(card.getByRole('button', { name: 'Quitar de Escuchar más tarde: Azul', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/profile?tab=later');
  await expect(page.getByRole('button', {name:'Para Ti', exact:true})).toBeVisible();
  await expect(page.locator('a[href="/profile?tab=later"], a[href="/profile?tab=discarded"]')).toHaveCount(0);
  const list = page.getByRole('region', { name: 'Escuchar más tarde', exact: true });
  await expect(list.getByText('1 release', { exact: true })).toBeVisible();
  await list.getByRole('button', { name: 'Quitar de Escuchar más tarde: Azul', exact: true }).click();
  await expect(list.getByText('0 releases', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Gashapon shows four platforms, permanently excludes a discard, and restores it only from history', async ({ page }) => {
  await libraryAccount(page);
  await page.goto('/gashapon?genero=pop');
  await page.getByRole('button', { name: 'Giro rápido', exact: true }).click();
  await page.getByRole('button', { name: '¡GIRAR GASHAPON!', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Tu próxima escucha', exact: true })).toBeVisible();
  for (const name of ['Spotify', 'Apple Music', 'YouTube Music', 'Deezer']) await expect(dialog.getByRole('link', { name, exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Descartar del Gashapon', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: '¡GIRAR GASHAPON!', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Historial de descartes (1)', exact: true }).click();
  const history = page.getByRole('region', { name: 'Historial de descartes del Gashapon', exact: true });
  await history.getByRole('button', { name: 'Reactivar en el Gashapon', exact: true }).click();
  await expect(history.getByText('Reactivado en el Gashapon', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '¡GIRAR GASHAPON!', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
