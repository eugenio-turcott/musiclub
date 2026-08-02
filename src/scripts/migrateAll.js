// src/scripts/migrateAll.js
import { migrateAlbums } from './migrateAlbums.js';
import { migrateAllReviews } from './migrateReviews.js';

async function migrateAll() {
    console.log('========================================');
    console.log('🚀 INICIANDO MIGRACIÓN COMPLETA A SUPABASE');
    console.log('========================================\n');

    try {
        // 1. Migrar álbumes primero
        await migrateAlbums();

        console.log('\n========================================\n');

        // 2. Migrar reviews
        await migrateAllReviews();

        console.log('\n========================================');
        console.log('✅ MIGRACIÓN COMPLETADA');
        console.log('========================================');
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

// Ejecutar
migrateAll();