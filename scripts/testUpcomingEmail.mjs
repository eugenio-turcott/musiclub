import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sendUpcomingConfirmationEmail } from '../src/services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testEmail = process.argv[2] || 'eugenioturcott@gmail.com';

async function runTest() {
  console.log('===========================================================');
  console.log('🧪 PRUEBA DE ENVÍO DE CORREO - CONFIRMACIÓN DE UPCOMING');
  console.log('===========================================================');
  console.log(`🎯 Correo destinatario: ${testEmail}`);

  // 1. Obtener o simular datos de un lanzamiento anticipado real
  const sampleUpcoming = {
    albumId: 'r5eokoeejp7861n4',
    albumName: "Nature’s Pill",
    artistName: 'Wishy',
    releaseDate: '2026-10-02',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    slug: 'wishy-nature-s-pill',
  };

  console.log(`💿 Álbum a notificar: "${sampleUpcoming.albumName}" de ${sampleUpcoming.artistName}`);
  console.log(`📅 Fecha de estreno prevista: ${sampleUpcoming.releaseDate}`);

  // 2. Persistir en la tabla upcoming_notifications de Supabase
  console.log('\n1️⃣ Registrando en tabla public.upcoming_notifications de Supabase...');
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('upcoming_notifications')
      .upsert(
        {
          album_id: sampleUpcoming.albumId,
          album_name: sampleUpcoming.albumName,
          artist_name: sampleUpcoming.artistName,
          release_date: sampleUpcoming.releaseDate,
          email: testEmail.toLowerCase().trim(),
          notified: false,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'album_id,email' }
      )
      .select();

    if (error) {
      console.error('❌ Error registrando en Supabase:', error.message);
    } else {
      console.log('✅ Registro exitoso en Supabase upcoming_notifications:', data);
    }
  } else {
    console.warn('⚠️ No se encontraron credenciales de Supabase en .env');
  }

  // 3. Ejecutar envío del correo de confirmación
  console.log('\n2️⃣ Enviando correo de confirmación con diseño Musiclub...');
  try {
    const result = await sendUpcomingConfirmationEmail({
      to: testEmail,
      albumName: sampleUpcoming.albumName,
      artistName: sampleUpcoming.artistName,
      releaseDate: sampleUpcoming.releaseDate,
      imageUrl: sampleUpcoming.imageUrl,
      albumUrl: `https://www.musiclub.org/albumes/${sampleUpcoming.slug}`,
    });

    console.log('\n===========================================================');
    console.log('🎉 RESULTADO DEL ENVÍO:');
    console.log('===========================================================');
    console.log(`Status: ${result.success ? 'EXITOSO' : 'FALLIDO'}`);
    console.log(`Proveedor / Modo: ${result.provider} (${result.mode})`);
    console.log(`MessageId: ${result.messageId}`);
    if (result.previewUrl) {
      console.log(`🌐 ENLACE DE PREVISUALIZACIÓN WEB (Ethereal Email):`);
      console.log(`👉 ${result.previewUrl}`);
      console.log('\n(Puedes abrir ese enlace en tu navegador para ver el correo HTML exacto tal como llega al buzón)');
    } else {
      console.log(`📩 El correo fue despachado directamente a ${testEmail}`);
    }
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ Error enviando correo:', err);
  }
}

runTest();
