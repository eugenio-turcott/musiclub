import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { sendPatchNotesEmail } from '../src/services/emailService.js';
import { CURATED_PATCH_NOTES } from '../src/data/patchNotesData.js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const targetArg = process.argv[2] ? process.argv[2].trim() : '';
const testEmailArg = process.argv[3] ? process.argv[3].trim() : '';

async function run() {
  console.log('📢 Preparando envío de novedades de Musiclub...');

  let patchNote = null;
  if (targetArg) {
    const cleanTarget = targetArg.replace(/^[vV]\.?\s*/, '').toLowerCase();
    patchNote = CURATED_PATCH_NOTES.find(
      (n) => n.version && n.version.replace(/^[vV]\.?\s*/, '').toLowerCase() === cleanTarget
    );
  }

  if (!patchNote && CURATED_PATCH_NOTES.length > 0) {
    patchNote = CURATED_PATCH_NOTES[0];
  }

  if (!patchNote) {
    console.error('❌ No se encontraron notas de versión en patchNotesData.js.');
    process.exit(1);
  }

  console.log(`📌 Versión seleccionada: ${patchNote.version} - "${patchNote.title}"`);

  let recipients = [];
  if (testEmailArg && testEmailArg.includes('@')) {
    console.log(`🧪 Modo de prueba: Enviando únicamente a ${testEmailArg}`);
    recipients = [testEmailArg];
  } else {
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Faltan credenciales de Supabase para obtener la lista de miembros.');
      process.exit(1);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: profiles, error } = await supabase.from('profiles').select('email, name');
    if (error) {
      console.error('❌ Error obteniendo profiles:', error.message);
      process.exit(1);
    }

    recipients = (profiles || [])
      .map((p) => p.email)
      .filter((e) => e && e.includes('@'));
  }

  console.log(`👥 Destinatarios totales: ${recipients.length}`);
  if (recipients.length === 0) {
    console.warn('⚠️ No hay destinatarios. Abortando envío.');
    return;
  }

  const result = await sendPatchNotesEmail({
    recipients,
    patchNote,
  });

  console.log('✅ Envío completado con éxito:', result);
}

run().catch((err) => {
  console.error('❌ Error en script de novedades:', err);
  process.exit(1);
});
