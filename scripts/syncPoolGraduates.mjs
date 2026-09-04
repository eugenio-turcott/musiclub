import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const profiles = {
  'Sora': { id: '13e16999-c077-428e-8dec-431662b40976', email: 'sora.welsh@gmail.com' },
  'Corpus': { id: '4c6a997c-1f83-482e-81ae-a9a1d548061a', email: 'david.corpus4@gmail.com' },
  'Jan': { id: 'dc09cefb-5483-4fe6-a9ef-fa839a7162f1', email: 'jancarlocbanda@gmail.com' },
  'Tadeo': { id: 'b9fb5b88-9061-4be5-8375-8fdaf8883116', email: 'gguerrerogg697.com@gmail.com' },
  'Eugenio': { id: 'e48280b3-d936-467f-9506-633bc930de64', email: 'eugenioturcott@gmail.com' },
  'Kraken': { id: '7a430cf8-6849-4f8e-b929-651558c0dd9b', email: 'kraken209254@gmail.com' },
  'Daniela': { id: '56bbb51e-a12a-4d31-b2ec-cfe6522940f8', email: 'danielarimq@gmail.com' },
  'Abel': { id: '1f473be4-720b-4c98-88c7-9c0d17ee7ccb', email: 'abelaleiva@gmail.com' },
  'Dante': { id: '92e44239-1bac-4000-9814-e61cb53a3722', email: 'rebeccarolaiz@gmail.com' },
  'Santi Espinoza': { id: '9a6b955f-afee-4ee8-88cc-f493187b6abb', email: 'angel.yaez2003@gmail.com' },
  'Yayo': { id: 'fa773d2d-846d-4b2e-b252-7f69f95927d6', email: 'elojobueno69@gmail.com' },
  'Devie 🍓': { id: 'a1755a6d-c051-497d-ac6c-4d78469c34e1', email: 'devshtp24@gmail.com' },
  'Valentín': { id: '84c5ffd6-c5b5-4c91-8ae0-a0712d33e147', email: 'valentihdz28@gmail.com' },
  'Alfredo': { id: 'dd747170-1071-42e5-84c6-54c207f0645c', email: 'alfredoescamilla8582@gmail.com' },
  'Cristina': { id: '5a2e7c23-c16c-47e3-a2a0-6521161499a9', email: 'roberto.roll.95@gmail.com' },
  'Ann': { id: '47a2f484-e862-4acc-b059-69f2395b2085', email: 'karlamdzav@gmail.com' },
  'Cait': { id: '14d4692f-5b56-43f5-b3f8-a5fc2db7a7da', email: 'ricardodg351@gmail.com' },
  'Jesus': { id: '45d91099-57ce-4689-b2ed-aed92a551c48', email: 'jesusroberto005@gmail.com' },
  'Oscar': { id: '7fbda975-1ea5-49fc-bd84-5d4068b3d8a2', email: 'oscaridrogo13@gmail.com' },
  'Rolis': { id: 'ce24dab8-2a24-40e6-8ea2-baadecbe96d3', email: 'ronaldoplay4pro@gmail.com' }
};

const targetList = [
  { artist: 'Weyes Blood', album: 'Titanic Rising', user: 'Cait' },
  { artist: 'Judeline', album: 'Bodhiria', user: 'Valentín' },
  { artist: 'Madonna', album: 'Confessions on a Dance Floor', user: 'Tadeo' },
  { artist: 'Little Jesus', album: 'Disco de Oro', user: 'Jesus' },
  { artist: 'Fujii Kaze', album: 'Prema', user: 'Devie 🍓' },
  { artist: 'pH-1', album: 'WHAT HAVE WE DONE', user: 'Sora' },
  { artist: 'Knocked Loose', album: "You Won't Go Before You're Supposed To", user: 'Cait' },
  { artist: 'Todos mueren en abril', album: 'Todos mueren en abril', user: 'Abel' },
  { artist: 'Ashe', album: 'Ashlyn', user: 'Oscar' },
  { artist: 'Serú Girán', album: 'La grasa de las capitales', user: 'Alfredo' },
  { artist: 'Sampha', album: 'Lahai', user: 'Valentín' },
  { artist: 'Porter Robinson', album: 'Smile! :D', user: 'Cristina' },
  { artist: 'DANNA', album: 'CHILDSTAR', user: 'Yayo' },
  { artist: 'Silvana Estrada', album: 'Marchita', user: 'Ann' },
  { artist: 'Tango Astral', album: 'Tango Astral', user: 'Caldito', customEmail: 'adperezglzz@gmail.com' },
  { artist: 'Sade', album: 'Love Deluxe', user: 'Eugenio' },
  { artist: 'Harry styles', album: 'Harry Styles', user: 'Daniela' },
  { artist: 'Aquihayaquihay', album: 'No Me Busques Donde Mismo', user: 'Melanie' },
  { artist: 'Allie X', album: 'Girl With No Face', user: 'Kraken' },
  { artist: 'Sen Senra', album: 'PO2054AZ (Vol.II)', user: 'Rolis' },
  { artist: 'Jane Remover', album: 'Revengeseekerz', user: 'Dante' }
];

async function sync() {
  console.log('🔄 Sincronizando 21 álbumes con pool_entries...\n');

  for (const item of targetList) {
    // 1. Buscar álbum en tabla albums
    const { data: albums, error: albErr } = await supabase
      .from('albums')
      .select('id, album_name, artist_name')
      .ilike('artist_name', `%${item.artist}%`)
      .ilike('album_name', `%${item.album}%`)
      .limit(1);

    if (albErr || !albums || albums.length === 0) {
      console.error(`❌ Álbum no encontrado en 'albums': ${item.artist} - ${item.album}`);
      continue;
    }

    const album = albums[0];

    // 2. Revisar si ya existe en pool_entries
    const { data: existingPool } = await supabase
      .from('pool_entries')
      .select('*')
      .eq('album_id', album.id);

    if (existingPool && existingPool.length > 0) {
      console.log(`ℹ️  Ya existe en pool_entries: "${album.album_name}" (${album.artist_name}) -> Estado: ${existingPool[0].status}, Nominado por: ${existingPool[0].nominated_by}`);
      continue;
    }

    // 3. Obtener perfil
    const prof = profiles[item.user] || {};
    const userId = prof.id || null;
    const nominatedBy = item.user;
    const nominatedByEmail = prof.email || item.customEmail || null;

    // 4. Insertar en pool_entries como GRADUADO
    const { data: inserted, error: insErr } = await supabase
      .from('pool_entries')
      .insert([
        {
          season_id: 'temporada-1',
          album_id: album.id,
          nominated_by: nominatedBy,
          nominated_by_email: nominatedByEmail,
          user_id: userId,
          status: 'GRADUADO',
          reviews_enabled: false,
          votes_count: 0
        }
      ])
      .select();

    if (insErr) {
      console.error(`❌ Error insertando en pool_entries (${album.album_name}):`, insErr.message);
    } else {
      console.log(`✅ Agregado como GRADUADO: "${album.album_name}" (${album.artist_name}) -> Nominado por: ${nominatedBy} (${nominatedByEmail})`);
    }
  }

  console.log('\n--- Resumen Final en pool_entries ---');
  const { data: allPool } = await supabase
    .from('pool_entries')
    .select('status, nominated_by, album:album_id(album_name, artist_name)')
    .order('created_at', { ascending: false });

  console.log(`Total registros en pool_entries: ${allPool.length}`);
  allPool.forEach((p, idx) => {
    console.log(`${(idx + 1).toString().padStart(2, ' ')}. [${p.status.padEnd(8)}] ${p.album?.artist_name} - ${p.album?.album_name} (Nominado por: ${p.nominated_by})`);
  });
}

sync().catch(console.error);
