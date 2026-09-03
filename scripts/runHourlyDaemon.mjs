// scripts/runHourlyDaemon.mjs
import { runIngestionBatch } from './hourlyMusicBrainzIngestion.mjs';

const ONE_HOUR_MS = 60 * 60 * 1000;
const BATCH_SIZE = 1000;

console.log(`\n========================================================`);
console.log(`🤖 MUSICLUB - DEMONIO DE INGESTA HORARIA MUSICBRAINZ`);
console.log(`🎯 Meta: Ingestar ${BATCH_SIZE} álbumes cada 60 minutos`);
console.log(`📡 Inicia: ${new Date().toLocaleString()}`);
console.log(`========================================================\n`);

async function executeCycle() {
  try {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Ejecutando ciclo programado de 1,000 álbumes...`);
    await runIngestionBatch(BATCH_SIZE);
  } catch (err) {
    console.error(`❌ Error en el ciclo de ingesta:`, err);
  } finally {
    const nextExecution = new Date(Date.now() + ONE_HOUR_MS);
    console.log(`⏳ Esperando para el siguiente ciclo horario: ${nextExecution.toLocaleTimeString()} (${nextExecution.toLocaleDateString()})\n`);
  }
}

// Ejecutar el primer lote de 1,000 inmediatamente
executeCycle();

// Programar cada hora (60 minutos)
setInterval(executeCycle, ONE_HOUR_MS);
