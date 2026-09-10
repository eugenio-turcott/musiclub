// scripts/generate-release-body.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const patchNotesPath = path.resolve(__dirname, '../src/data/patchNotesData.js');
  const mod = await import('file:///' + patchNotesPath.replace(/\\/g, '/'));
  const curated = mod.CURATED_PATCH_NOTES || [];

  // Versión solicitada (ej. v8.2 o V.8.2) o la más reciente
  const rawArg = process.argv[2] ? process.argv[2].trim() : '';
  const cleanTarget = rawArg.replace(/^[vV]\.?\s*/, '').toLowerCase();

  let note = null;
  if (cleanTarget) {
    note = curated.find(
      (n) => n.version && n.version.replace(/^[vV]\.?\s*/, '').toLowerCase() === cleanTarget
    );
  }

  if (!note && curated.length > 0) {
    note = curated[0];
  }

  if (!note) {
    console.error('⚠️ No se encontraron patch notes para generar release.');
    process.exit(1);
  }

  const typeIcons = {
    feature: '✨',
    fix: '🛠️',
    performance: '⚡',
    design: '🎨',
    security: '🔒',
    refactor: '♻️',
  };

  let body = `## 🎵 ${note.version}: ${note.title}\n\n`;
  body += `> 📅 **Fecha:** \`${note.date}\`  \n`;
  if (note.tag) body += `> 🏷️ **Categoría:** **${note.tag}**  \n`;
  if (note.authorName) body += `> 👤 **Autor:** ${note.authorName}  \n\n`;

  if (note.summary) {
    body += `### 📝 Resumen\n${note.summary}\n\n`;
  }

  if (Array.isArray(note.changes) && note.changes.length > 0) {
    body += `### 🚀 Novedades y Cambios Detallados\n`;
    note.changes.forEach((change) => {
      const icon = typeIcons[change.type] || '📌';
      body += `- ${icon} **${change.title}**\n  ${change.description}\n\n`;
    });
  }

  body += `---\n*Generado automáticamente desde las notas de versión oficiales de Musiclub.*\n`;

  const outputPath = path.resolve(__dirname, '../RELEASE_BODY.md');
  fs.writeFileSync(outputPath, body, 'utf8');
  console.log(`✅ Archivo RELEASE_BODY.md generado con éxito para ${note.version}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
