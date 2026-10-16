import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { allowRequest } from './rateLimit';

export async function authorize(request, { admin = false, cron = false } = {}) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer) return { error: NextResponse.json({ error: 'Inicia sesión para continuar' }, { status: 401 }) };
  if (cron && process.env.CRON_SECRET) {
    const expected = Buffer.from(process.env.CRON_SECRET), provided = Buffer.from(bearer);
    if (expected.length === provided.length && timingSafeEqual(expected, provided)) return { cron: true };
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${bearer}` } } });
  const { data: { user }, error } = await db.auth.getUser(bearer);
  if (error || !user) return { error: NextResponse.json({ error: 'Sesión no válida' }, { status: 401 }) };
  const path = new URL(request.url).pathname;
  if (!allowRequest(`${user.id}:${path}`, path.includes('/notifications/') ? 5 : 30)) {
    return { error: NextResponse.json({ error: 'Espera un momento antes de intentarlo otra vez' }, { status: 429, headers: { 'Retry-After': '60' } }) };
  }
  // Administrative identity is configured on the server, never accepted from a form or editable profile.
  const admins = (process.env.ADMIN_EMAILS || 'tadeoemiliano@hotmail.com,eugenioturcott@gmail.com').split(',').map(s => s.trim().toLowerCase());
  if (admin && !admins.includes(user.email?.toLowerCase())) return { error: NextResponse.json({ error: 'Acceso no permitido' }, { status: 403 }) };
  return { user, db };
}
