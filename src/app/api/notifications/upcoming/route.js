import { NextResponse } from 'next/server';
import { sendUpcomingConfirmationEmail } from '../../../../services/emailService';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      albumId,
      albumName,
      artistName,
      releaseDate,
      email,
      imageUrl,
      slug,
      userId,
      lang = 'es',
    } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Correo electrónico inválido' },
        { status: 400 }
      );
    }

    if (!albumName || !artistName) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos del álbum o artista' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Guardar o actualizar en la tabla upcoming_notifications de Supabase
    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.REACT_APP_SUPABASE_URL ||
        process.env.SUPABASE_URL;

      const supabaseKey =
        process.env.REACT_APP_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        await supabase
          .from('upcoming_notifications')
          .upsert(
            {
              album_id: String(albumId || albumName),
              album_name: albumName,
              artist_name: artistName,
              release_date: releaseDate || null,
              email: cleanEmail,
              user_id: userId || null,
              notified: false,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'album_id,email' }
          );
      }
    } catch (dbErr) {
      console.warn('⚠️ Nota sobre persistencia en BD:', dbErr.message);
    }

    // 2. Construir enlace canónico de Musiclub
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.musiclub.org';
    const albumUrl = slug
      ? `${baseUrl}/albumes/${slug}`
      : `${baseUrl}/catalogo`;

    // 3. Enviar correo de confirmación inmediato
    const emailResult = await sendUpcomingConfirmationEmail({
      to: cleanEmail,
      albumName,
      artistName,
      releaseDate,
      imageUrl,
      albumUrl,
      lang,
    });

    return NextResponse.json({
      success: true,
      message: 'Notificación registrada y correo de confirmación enviado exitosamente',
      emailResult,
    });
  } catch (error) {
    console.error('Error al procesar notificación de estreno:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al procesar el correo de notificación',
      },
      { status: 500 }
    );
  }
}
