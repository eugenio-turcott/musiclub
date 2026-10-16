import { deliverNotificationOnce } from '../../../../services/notificationDelivery';
import { NextResponse } from 'next/server';
import { authorize } from '../../../../server/authorize';
import { sendSongRecommendationEmail } from '../../../../services/emailService';
export const runtime = 'nodejs';
export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  try {
    const { recommendationId } = await request.json();
    if (!recommendationId) return NextResponse.json({ error: 'Falta la recomendación guardada' }, { status: 400 });
    const { data: row, error } = await auth.db.from('song_recommendations').select('*').eq('id', recommendationId).maybeSingle();
    if (error || !row || row.sender_email?.toLowerCase() !== auth.user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Recomendación no permitida' }, { status: 403 });
    }
    // Addresses and content come from the stored recommendation, not arbitrary request recipients.
    if (!row.recipient_id) return NextResponse.json({ error: 'Destinatario no disponible' }, { status: 400 });
    const result = await deliverNotificationOnce(auth.db, `recommendation:${row.id}`, () => sendSongRecommendationEmail({ recipientEmail: row.recipient_email, recipientName: row.recipient_name,
      senderName: auth.user.user_metadata?.full_name || row.sender_name, songTitle: row.song_title, artistName: row.artist_name,
      albumName: row.album_name, imageUrl: row.image_url, spotifyLink: row.spotify_link, youtubeLink: row.youtube_link,
      appleMusicLink: row.apple_music_link, deezerLink: row.deezer_link || row.other_link, message: row.message }));
    return NextResponse.json({ success: true, isTest: Boolean(result.isTest) });
  } catch { return NextResponse.json({ error: 'No se pudo enviar el aviso' }, { status: 500 }); }
}
