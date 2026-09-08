import { runSmartSeed } from './smartCatalogSeeder.mjs';

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
const BATCH_SIZE = 50; // Cantidad por ciclo: 65% 2026, 20% famosos, 15% décadas

console.log(`\n========================================================`);
console.log(`🤖 MUSICLUB - DEMONIO DE SIEMBRA INTELIGENTE`);
console.log(`🎯 Meta: Poblar ${BATCH_SIZE} álbumes (65% 2026 / 20% Tendencia / 15% Décadas) cada 30 min`);
console.log(`📡 Inicia: ${new Date().toLocaleString()}`);
console.log(`========================================================\n`);

async function executeCycle() {
  try {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Ejecutando ciclo de siembra inteligente (${BATCH_SIZE} álbumes)...`);
    await runSmartSeed({ target: BATCH_SIZE, sitemap: true });
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
