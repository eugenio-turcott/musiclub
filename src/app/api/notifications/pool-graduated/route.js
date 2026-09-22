import { NextResponse } from 'next/server';
import { sendPoolGraduatedEmail } from '../../../../services/emailService';
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
      recipientEmail, // Opcional: si se quiere enviar a un solo correo para pruebas
      lang = 'es',
    } = body;

    if (!albumId) {
      return NextResponse.json(
        { success: false, error: 'albumId es obligatorio' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No se pudo conectar con la base de datos' },
        { status: 500 }
      );
    }

    // 1. Obtener datos del álbum
    const { data: album, error: albErr } = await supabase
      .from('albums')
      .select('*')
      .eq('id', albumId)
      .maybeSingle();

    if (albErr || !album) {
      return NextResponse.json(
        { success: false, error: 'Álbum no encontrado' },
        { status: 404 }
      );
    }

    // 2. Obtener reseñas del álbum para calcular estadísticas
    const { data: reviews, error: revErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('album_id', albumId);

    const reviewList = reviews || [];
    const totalReviews = reviewList.length;

    // Calcular promedios
    let sumGeneral = 0;
    let sumProd = 0;
    let sumComp = 0;
    let sumLetras = 0;
    let sumOrig = 0;
    let sumCohesion = 0;
    let sumReplay = 0;
    let prodCount = 0;
    let compCount = 0;
    let letrasCount = 0;
    let origCount = 0;
    let cohesionCount = 0;
    let replayCount = 0;

    const favoriteTracksMap = {};
    const highlightQuotes = [];

    reviewList.forEach((r) => {
      const g = parseFloat(r.rating_general);
      if (!isNaN(g)) sumGeneral += g;

      if (r.rating_produccion !== null && !isNaN(r.rating_produccion)) {
        sumProd += parseFloat(r.rating_produccion);
        prodCount++;
      }
      if (r.rating_composicion !== null && !isNaN(r.rating_composicion)) {
        sumComp += parseFloat(r.rating_composicion);
        compCount++;
      }
      if (r.rating_letras !== null && !isNaN(r.rating_letras)) {
        sumLetras += parseFloat(r.rating_letras);
        letrasCount++;
      }
      if (r.rating_originalidad !== null && !isNaN(r.rating_originalidad)) {
        sumOrig += parseFloat(r.rating_originalidad);
        origCount++;
      }
      if (r.rating_cohesion !== null && !isNaN(r.rating_cohesion)) {
        sumCohesion += parseFloat(r.rating_cohesion);
        cohesionCount++;
      }
      if (r.rating_replay !== null && !isNaN(r.rating_replay)) {
        sumReplay += parseFloat(r.rating_replay);
        replayCount++;
      }

      if (r.favorite_track && typeof r.favorite_track === 'string') {
        const ft = r.favorite_track.trim();
        favoriteTracksMap[ft] = (favoriteTracksMap[ft] || 0) + 1;
      }

      if (r.comment && r.comment.trim().length > 15) {
        highlightQuotes.push({
          comment: r.comment.trim(),
          reviewer: r.reviewer_name || 'Miembro',
        });
      }
    });

    const avgScore =
      totalReviews > 0 ? (sumGeneral / totalReviews).toFixed(1) : (album.avg_rating || '8.0');

    const breakdown = {
      produccion: prodCount > 0 ? (sumProd / prodCount).toFixed(1) : null,
      composicion: compCount > 0 ? (sumComp / compCount).toFixed(1) : null,
      letras: letrasCount > 0 ? (sumLetras / letrasCount).toFixed(1) : null,
      originalidad: origCount > 0 ? (sumOrig / origCount).toFixed(1) : null,
      cohesion: cohesionCount > 0 ? (sumCohesion / cohesionCount).toFixed(1) : null,
      replay: replayCount > 0 ? (sumReplay / replayCount).toFixed(1) : null,
    };

    const topTracks = Object.entries(favoriteTracksMap)
      .sort((a, b) => b[1] - a[1])
      .map(([track]) => track)
      .slice(0, 3);

    // 3. Destinatarios
    let recipients = [];
    if (recipientEmail) {
      recipients = [recipientEmail];
    } else {
      const { data: profiles } = await supabase.from('profiles').select('email');
      if (Array.isArray(profiles)) {
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

    // 4. Despachar correo de graduación
    const result = await sendPoolGraduatedEmail({
      recipients,
      albumName: album.album_name,
      artistName: album.artist_name,
      imageUrl: album.image_url,
      nominatedBy: album.added_by || 'Miembro del Club',
      avgScore,
      totalReviews,
      breakdown,
      topTracks,
      highlightQuotes,
      lang,
    });

    return NextResponse.json({
      success: true,
      message: 'Correo de graduación de álbum del Pool enviado con éxito',
      avgScore,
      totalReviews,
      result,
    });
  } catch (error) {
    console.error('Error en /api/notifications/pool-graduated:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
