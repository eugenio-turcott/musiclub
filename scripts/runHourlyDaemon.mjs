// scripts/runHourlyDaemon.mjs
import { runIngestionBatch } from './hourlyMusicBrainzIngestion.mjs';

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
const BATCH_SIZE = 50; // Cantidad razonable por ciclo para respetar límites y timeouts

console.log(`\n========================================================`);
console.log(`🤖 MUSICLUB - DEMONIO DE INGESTA AUTOMÁTICA`);
console.log(`🎯 Meta: Ingestar ${BATCH_SIZE} álbumes canónicos cada 30 minutos`);
console.log(`📡 Inicia: ${new Date().toLocaleString()}`);
console.log(`========================================================\n`);

async function executeCycle() {
  try {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Ejecutando ciclo programado de ${BATCH_SIZE} álbumes...`);
    await runIngestionBatch(BATCH_SIZE);
  } catch (err) {
    console.error(`❌ Error en el ciclo de ingesta:`, err);
  } finally {
    const nextExecution = new Date(Date.now() + INTERVAL_MS);
    console.log(`⏳ Esperando para el siguiente ciclo: ${nextExecution.toLocaleTimeString()} (${nextExecution.toLocaleDateString()})\n`);
  }
}

// Ejecutar el primer lote inmediatamente
executeCycle();

// Programar cada 30 minutos
setInterval(executeCycle, INTERVAL_MS);
