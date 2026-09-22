import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { sendUpcomingReleaseDayEmail } from '../src/services/emailService.js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUpcomingReleases() {
  console.log('🌙 Ejecutando verificación nocturna de estrenos de álbumes (12:00 AM)...');

  const today = new Date().toISOString().split('T')[0];
  console.log(`📅 Fecha de corte actual: ${today}`);

  const { data: pending, error } = await supabase
    .from('upcoming_notifications')
    .select('*')
    .eq('notified', false)
    .lte('release_date', today);

  if (error) {
    console.error('❌ Error consultando upcoming_notifications:', error.message);
    return;
  }

  if (!pending || pending.length === 0) {
    console.log('✨ No hay estrenos pendientes para notificar el día de hoy.');
    return;
  }

  console.log(`🚀 Se encontraron ${pending.length} notificaciones de estreno para procesar.`);

  for (const item of pending) {
    try {
      let imageUrl = null;
      if (item.album_id) {
        const { data: alb } = await supabase
          .from('albums')
          .select('image_url, id')
          .eq('id', item.album_id)
          .maybeSingle();
        if (alb?.image_url) imageUrl = alb.image_url;
      }

      const albumUrl = item.album_id
        ? `https://www.musiclub.org/albumes/${item.album_id}`
        : 'https://www.musiclub.org/catalogo';

      console.log(`📤 Enviando correo de estreno a ${item.email} para "${item.album_name}"...`);

      const res = await sendUpcomingReleaseDayEmail({
        to: item.email,
        albumName: item.album_name,
        artistName: item.artist_name,
        imageUrl,
        albumUrl,
      });

      await supabase
        .from('upcoming_notifications')
        .update({ notified: true })
        .eq('id', item.id);

      console.log(`✅ Notificado exitosamente a ${item.email} (Id: ${res.messageId || 'ok'})`);
    } catch (err) {
      console.error(`❌ Error enviando a ${item.email}:`, err.message);
    }
  }

  console.log('🏁 Proceso de notificación de estrenos completado.');
}

checkUpcomingReleases().catch(console.error);
