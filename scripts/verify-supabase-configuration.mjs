import { createClient } from '@supabase/supabase-js';

// Run only in a trusted server/Actions environment. Never log keys or returned rows.
async function verify() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const publicKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey?.startsWith('sb_publishable_') || !serverKey?.startsWith('sb_secret_')) {
    throw new Error('Falta la configuración de Supabase o alguna clave sigue usando el formato antiguo.');
  }
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== 'nzsuxrycbywbdyidvsfl.supabase.co') {
    throw new Error('La dirección no corresponde al proyecto Supabase de Musiclub.');
  }
  const options = { auth: { persistSession: false, autoRefreshToken: false }, global: {
    fetch: (resource, init) => fetch(resource, { ...init, signal: AbortSignal.timeout(15000) }),
  } };
  const publicDb = createClient(url, publicKey, options);
  const serverDb = createClient(url, serverKey, options);
  const catalog = await publicDb.from('public_reviews').select('id', { head: true }).limit(1);
  if (catalog.error) throw new Error('La clave pública nueva no permite leer el catálogo público.');
  console.log('PASS: lectura pública con la clave publicable nueva.');
  for (const table of ['reviews', 'profiles', 'musiclub_notification_deliveries']) {
    const result = await publicDb.from(table).select(table === 'musiclub_notification_deliveries' ? 'delivery_key' : 'id').limit(1);
    if (result.error && result.error.code !== '42501') {
      throw new Error('No se pudo completar la comprobación de aislamiento público.');
    }
    if (!result.error && result.data?.length) throw new Error('La lectura anónima devolvió un registro privado.');
  }
  console.log('PASS: las lecturas anónimas no devuelven reseñas privadas, perfiles privados ni entregas.');
  const delivery = await serverDb.from('musiclub_notification_deliveries').select('delivery_key', { head: true }).limit(1);
  if (delivery.error) throw new Error('La clave privada nueva no permite la lectura reservada al servidor.');
  console.log('PASS: acceso del servidor con la clave secreta nueva. Sin escrituras ni correos.');
}

verify().catch(error => {
  // Deliberately do not log raw SDK errors, HTTP headers, requests or returned data.
  const safe = new Set([
    'Falta la configuración de Supabase o alguna clave sigue usando el formato antiguo.',
    'La dirección no corresponde al proyecto Supabase de Musiclub.',
    'La clave pública nueva no permite leer el catálogo público.',
    'No se pudo completar la comprobación de aislamiento público.',
    'La lectura anónima devolvió un registro privado.',
    'La clave privada nueva no permite la lectura reservada al servidor.',
  ]);
  console.error(safe.has(error.message) ? error.message : 'No se pudo completar la comprobación de Supabase.');
  process.exitCode = 1;
});
