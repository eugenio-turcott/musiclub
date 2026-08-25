// src/scripts/migrateFavoriteTracks.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://nzsuxrycbywbdyidvsfl.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falta URL o Key de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Encuentra la canción favorita basada en el puntaje más alto.
 * Si hay empate (por ejemplo múltiples con 10 o el puntaje máximo), elige una aleatoria.
 */
export function chooseFavoriteTrack(trackRatings) {
  if (!trackRatings || typeof trackRatings !== 'object') return null;

  const entries = Object.entries(trackRatings).filter(
    ([_, val]) => val !== null && val !== undefined && !isNaN(Number(val))
  );

  if (entries.length === 0) return null;

  const maxScore = Math.max(...entries.map(([_, v]) => Number(v)));
  const topTracks = entries.filter(([_, v]) => Number(v) === maxScore).map(([key]) => key);

  if (topTracks.length === 0) return null;
  if (topTracks.length === 1) return topTracks[0];

  // Desempate aleatorio entre las canciones con mayor calificación
  const randomIndex = Math.floor(Math.random() * topTracks.length);
  return topTracks[randomIndex];
}

export async function migrateFavoriteTracks() {
  console.log('====================================================');
  console.log('⭐ INICIANDO ACTUALIZACIÓN MASIVA: CANCIÓN FAVORITA');
  console.log('====================================================\n');

  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, reviewer_name, album_id, track_ratings, rating_general');

    if (error) {
      console.error('❌ Error al consultar reviews:', error.message);
      return;
    }

    if (!reviews || reviews.length === 0) {
      console.log('⚠️ No se encontraron reviews en la base de datos.');
      return;
    }

    console.log(`📊 Total de reviews encontradas: ${reviews.length}`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const review of reviews) {
      const fav = chooseFavoriteTrack(review.track_ratings);

      if (!fav) {
        console.log(`⏩ Review ${review.id} (${review.reviewer_name}): Sin track_ratings válidos. Omitiendo.`);
        skippedCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('reviews')
        .update({ favorite_track: fav })
        .eq('id', review.id);

      if (updateError) {
        console.error(`❌ Error actualizando review ${review.id}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ Review ${review.id} (${review.reviewer_name}): ⭐ Favorita asignada -> "${fav}"`);
        updatedCount++;
      }
    }

    console.log('\n====================================================');
    console.log('🎉 RESUMEN DE ACTUALIZACIÓN MASIVA');
    console.log(`✔️ Actualizadas con éxito: ${updatedCount}`);
    console.log(`⏩ Omitidas (sin canciones): ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error general en la migración:', err);
  }
}

// Ejecución directa si se corre desde CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateFavoriteTracks();
}
