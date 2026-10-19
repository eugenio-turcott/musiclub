import { createHash } from 'node:crypto';
import { deliverNotificationOnce } from '../../../../services/notificationDelivery';
import { authorize } from '../../../../server/authorize';
import { NextResponse } from 'next/server';
import { sendPoolGraduatedEmail } from '../../../../services/emailService';
import { buildAlbumWithFullStats } from '../../../../services/supabaseClient';
import { getReleaseUrl } from '../../../../utils/ratingUtils';
import { getCommunityFavoriteTracks } from '../../../../utils/communityFavorites';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await authorize(request, {"admin":true});
  if (auth.error) return auth.error;
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

    const supabase = auth.db;
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

    if (revErr) throw new Error('No se pudieron consultar las reseñas del álbum');
    const reviewList = reviews || [];
    // Use the same weighted score and pillar averages as the public album page.
    const stats = buildAlbumWithFullStats(album, reviewList);
    const totalReviews = stats.review_count;
    const avgScore = stats.final_rating == null ? null : Number(stats.final_rating).toFixed(1);
    const breakdown = Object.fromEntries(['produccion', 'composicion', 'letras', 'originalidad', 'cohesion', 'replay']
      .map(key => [key, stats.criteria_averages[`rating_${key}`] ?? null]));
    const topTracks = getCommunityFavoriteTracks(reviewList, album.tracks || [], stats.track_stats);
    const highlightQuotes = reviewList.filter(r => typeof r.comment === 'string' && r.comment.trim().length > 15)
      .map(r => ({ comment: r.comment.trim(), reviewer: r.reviewer_name || 'Miembro' }));

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
    const deliveryKey = 'pool-graduated:' + createHash('sha256').update(JSON.stringify([album.id, reviewList.map(r => [r.id, r.rating_general, r.track_ratings, r.comment]), [...recipients].sort(), lang])).digest('hex');
    const result = await deliverNotificationOnce(supabase, deliveryKey, () => sendPoolGraduatedEmail({
      recipients,
      albumName: album.album_name,
      artistName: album.artist_name,
      imageUrl: album.image_url,
      genres: album.genres || [],
      nominatedBy: album.added_by || 'Miembro del Club',
      avgScore,
      totalReviews,
      breakdown,
      topTracks,
      highlightQuotes,
      lang,
      poolUrl: `https://www.musiclub.org${getReleaseUrl(album)}`,
    }));

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
