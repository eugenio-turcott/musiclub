import { NextResponse } from 'next/server';
import { sendSongRecommendationEmail } from '../../../../services/emailService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      senderName,
      recipientName,
      recipientEmail,
      songTitle,
      artistName,
      albumName,
      imageUrl,
      spotifyLink,
      youtubeLink,
      appleMusicLink,
      deezerLink,
      otherLink,
      message,
      lang = 'es',
    } = body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Correo del destinatario no válido' },
        { status: 400 }
      );
    }

    if (!songTitle || !artistName) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos de la canción o artista' },
        { status: 400 }
      );
    }

    const emailResult = await sendSongRecommendationEmail({
      recipientEmail: recipientEmail.trim().toLowerCase(),
      recipientName: recipientName || 'Compañero',
      senderName: senderName || 'Miembro de Musiclub',
      songTitle,
      artistName,
      albumName,
      imageUrl,
      spotifyLink,
      youtubeLink,
      appleMusicLink,
      deezerLink: deezerLink || otherLink,
      message,
      lang,
    });

    return NextResponse.json({
      success: true,
      message: 'Correo de recomendación despachado correctamente',
      emailResult,
    });
  } catch (error) {
    console.error('Error en /api/notifications/recommendation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
