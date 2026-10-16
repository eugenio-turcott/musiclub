import { deliverNotificationOnce } from '../../../../services/notificationDelivery';
import { authorize } from '../../../../server/authorize';
import { NextResponse } from 'next/server';
import { sendUpcomingConfirmationEmail } from '../../../../services/emailService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await authorize(request, {});
  if (auth.error) return auth.error;
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

    const cleanEmail = auth.user.email.toLowerCase();
    if (email.trim().toLowerCase() !== cleanEmail) return NextResponse.json({ error: 'Solo puedes suscribirte con tu cuenta' }, { status: 403 });

    const { data: subscription, error: subscriptionError } = await auth.db.from('upcoming_notifications')
      .upsert({ album_id: String(albumId || albumName), album_name: albumName, artist_name: artistName,
        release_date: releaseDate || null, email: cleanEmail, user_id: auth.user.id }, { onConflict: 'album_id,email' })
      .select('id').single();
    if (subscriptionError || !subscription) throw new Error('No se pudo guardar la suscripción. No se envió el aviso.');

    // 2. Construir enlace canónico de Musiclub
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.musiclub.org';
    const albumUrl = slug
      ? `${baseUrl}/albumes/${slug}`
      : `${baseUrl}/catalogo`;

    // 3. Enviar correo de confirmación inmediato
    const emailResult = await deliverNotificationOnce(auth.db, `upcoming-confirmation:${subscription.id}`, () => sendUpcomingConfirmationEmail({
      to: cleanEmail,
      albumName,
      artistName,
      releaseDate,
      imageUrl,
      albumUrl,
      lang,
    }));

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
