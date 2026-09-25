import { NextResponse } from 'next/server';
import { sendUpcomingReleaseDayEmail } from '../../../../../services/emailService';
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

async function processReleaseNotifications() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error('No se pudo conectar a Supabase.');
  }

  // Fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Consultar notificaciones pendientes cuyo estreno ya llegó
  const { data: pending, error } = await supabase
    .from('upcoming_notifications')
    .select('*')
    .eq('notified', false)
    .lte('release_date', today);

  if (error) {
    throw new Error(`Error consultando upcoming_notifications: ${error.message}`);
  }

  const results = [];
  const items = pending || [];

  for (const item of items) {
    try {
      // Intentar obtener la portada desde la tabla albums si no la tiene
      let imageUrl = null;
      let targetAlbumId = item.album_id;

      if (item.album_id) {
        const { data: alb } = await supabase
          .from('albums')
          .select('image_url, id')
          .eq('id', item.album_id)
          .maybeSingle();
        if (alb?.image_url) {
          imageUrl = alb.image_url;
          targetAlbumId = alb.id;
        }
      }

      if (!imageUrl && item.album_name) {
        const { data: alb } = await supabase
          .from('albums')
          .select('image_url, id')
          .ilike('album_name', item.album_name)
          .ilike('artist_name', item.artist_name)
          .maybeSingle();
        if (alb) {
          imageUrl = alb.image_url;
          targetAlbumId = alb.id;
        }
      }

      const albumUrl = targetAlbumId
        ? `https://www.musiclub.org/albumes/${targetAlbumId}`
        : 'https://www.musiclub.org/catalogo';

      const emailRes = await sendUpcomingReleaseDayEmail({
        to: item.email,
        albumName: item.album_name,
        artistName: item.artist_name,
        imageUrl,
        albumUrl,
      });

      // Solo marcar como notificado si se envió con un proveedor SMTP real
      if (!emailRes.isTest && emailRes.provider !== 'ethereal') {
        await supabase
          .from('upcoming_notifications')
          .update({ notified: true })
          .eq('id', item.id);
      }

      results.push({
        id: item.id,
        email: item.email,
        album: item.album_name,
        success: !emailRes.isTest && emailRes.provider !== 'ethereal',
        isTest: emailRes.isTest,
        emailRes,
      });
    } catch (sendErr) {
      console.error(`Error enviando notificación de estreno a ${item.email}:`, sendErr);
      results.push({
        id: item.id,
        email: item.email,
        album: item.album_name,
        success: false,
        error: sendErr.message,
      });
    }
  }

  return {
    today,
    totalPending: items.length,
    processed: results,
  };
}

export async function GET() {
  try {
    const data = await processReleaseNotifications();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error en GET /api/notifications/upcoming/check-releases:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const data = await processReleaseNotifications();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error en POST /api/notifications/upcoming/check-releases:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
