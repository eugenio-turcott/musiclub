import { NextResponse } from 'next/server';
import { sendPoolWinnerEmail } from '../../../../services/emailService';
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
    const body = await request.json();
    const {
      albumId,
      seasonId = 'temporada-1',
      recipientEmail, // Opcional: si se quiere enviar a uno de prueba
      lang = 'es',
    } = body;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No se pudo inicializar cliente de base de datos' },
        { status: 500 }
      );
    }

    // 1. Obtener datos del álbum ganador
    let albumData = body.albumData || null;
    let nominatedBy = body.nominatedBy || null;

    if (!albumData && albumId) {
      const { data: alb, error: albErr } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .maybeSingle();

      if (albErr || !alb) {
        return NextResponse.json(
          { success: false, error: 'Álbum no encontrado' },
          { status: 404 }
        );
      }
      albumData = alb;
      nominatedBy = alb.added_by;
    }

    if (!albumData) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos del álbum ganador' },
        { status: 400 }
      );
    }

    // 2. Si hay tabla pool_entries, obtener quién lo nominó de ahí
    if (albumId && !nominatedBy) {
      try {
        const { data: pEntry } = await supabase
          .from('pool_entries')
          .select('nominated_by')
          .eq('album_id', albumId)
          .maybeSingle();
        if (pEntry?.nominated_by) nominatedBy = pEntry.nominated_by;
      } catch (e) {}
    }

    // 3. Obtener destinatarios (todos los miembros de profiles con email)
    let recipients = [];
    if (recipientEmail) {
      recipients = [recipientEmail];
    } else {
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('email, name');

      if (!profErr && Array.isArray(profiles)) {
        recipients = profiles
          .map((p) => p.email)
          .filter((e) => e && e.includes('@'));
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron destinatarios en profiles' },
        { status: 400 }
      );
    }

    // 4. Despachar correo de ganador
    const result = await sendPoolWinnerEmail({
      recipients,
      albumName: albumData.album_name || albumData.album,
      artistName: albumData.artist_name || albumData.artista,
      imageUrl: albumData.image_url || albumData.imagen,
      nominatedBy: nominatedBy || albumData.added_by || 'Miembro del Club',
      seasonName: 'Temporada 1: El Origen del Club',
      spotifyLink: albumData.spotify_link || albumData.spotifyLink,
      youtubeLink: albumData.youtube_link || albumData.youtubeLink,
      appleMusicLink: albumData.apple_music_link || albumData.appleMusicLink,
      deezerLink: albumData.other_link || albumData.deezer_link || albumData.deezerLink,
      lang,
    });

    return NextResponse.json({
      success: true,
      message: 'Correo de nuevo ganador del Pool enviado a los miembros',
      result,
    });
  } catch (error) {
    console.error('Error en /api/notifications/pool-winner:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
