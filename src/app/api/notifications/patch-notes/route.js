import { NextResponse } from 'next/server';
import { sendPatchNotesEmail } from '../../../../services/emailService';
import { CURATED_PATCH_NOTES } from '../../../../data/patchNotesData';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSupabaseServerClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request) {
  try {
    // DESACTIVADO TEMPORALMENTE PARA LA VERSIÓN 9.3 A PETICIÓN DEL USUARIO
    return NextResponse.json({
      success: true,
      disabled: true,
      message: 'Envío de correos de Patch Notes temporalmente desactivado para la versión 9.3',
    });

    const body = await request.json().catch(() => ({}));
    const {
      version,
      recipientEmail,
      sendToAll = false,
      lang = 'es',
    } = body;

    // 1. Obtener la nota de parche adecuada
    let patchNote = null;
    if (version) {
      const cleanTarget = version.replace(/^[vV]\.?\s*/, '').toLowerCase();
      patchNote = CURATED_PATCH_NOTES.find(
        (n) => n.version && n.version.replace(/^[vV]\.?\s*/, '').toLowerCase() === cleanTarget
      );
    }

    if (!patchNote && CURATED_PATCH_NOTES.length > 0) {
      patchNote = CURATED_PATCH_NOTES[0];
    }

    if (!patchNote) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron notas de parche para enviar' },
        { status: 404 }
      );
    }

    // 2. Determinar destinatarios
    let recipients = [];
    if (recipientEmail) {
      recipients = [recipientEmail];
    } else if (sendToAll) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data: profiles } = await supabase.from('profiles').select('email');
        if (Array.isArray(profiles)) {
          recipients = profiles
            .map((p) => p.email)
            .filter((e) => e && e.includes('@'));
        }
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Debes especificar recipientEmail para prueba o sendToAll: true para enviar a todos los miembros',
        },
        { status: 400 }
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron destinatarios válidos' },
        { status: 400 }
      );
    }

    // 3. Enviar correo de novedades humanizado
    const result = await sendPatchNotesEmail({
      recipients,
      patchNote,
      lang,
    });

    return NextResponse.json({
      success: true,
      message: `Correo de novedades para la versión ${patchNote.version} despachado exitosamente`,
      version: patchNote.version,
      result,
    });
  } catch (error) {
    console.error('Error en /api/notifications/patch-notes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
