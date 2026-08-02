// src/scripts/migrateAlbums.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = 'https://nzsuxrycbywbdyidvsfl.supabase.co';
const supabaseKey = 'sb_secret_PeXf7FK1XEqIqPUIWFsmGA_vTELlo9j'; // Usar service key para migración
const supabase = createClient(supabaseUrl, supabaseKey);

// Datos completos del pool de álbumes
const albumsData = [
    {
        album_name: 'Confessions II',
        artist_name: 'Madonna',
        image_url: 'https://www.madonna.com/cdn/shop/files/CONFESSIONS2_745da7c4-683d-40ac-9a33-62dfc582e3a5.jpg?v=1782941623',
        link: 'https://music.youtube.com/playlist?list=OLAK5uy_kfzuXqPQdrfPwbEQb3DFv9TNXmz3send0&si=_C7v7qAtKw6xiHJj',
        status: 'ACTIVO',
        added_by: 'Tadeo',
        added_by_email: 'tadeoemiliano@hotmail.com',
        created_at: '2026-07-13T21:38:25'
    },
    {
        album_name: 'Disco de Oro',
        artist_name: 'Little Jesus',
        image_url: 'https://resources.sanborns.com.mx/imagenes-sanborns-ii/1200/190759443620.jpg',
        link: 'https://open.spotify.com/album/1ywMOLYln5Df2bF70jtydj?si=2ytUwyheTsC04YQrrLECIw',
        status: 'INACTIVO',
        added_by: 'Jesús',
        added_by_email: 'jesusroberto005@gmail.com',
        created_at: '2026-07-13T21:56:58'
    },
    {
        album_name: 'Prema',
        artist_name: 'Fujii Kaze',
        image_url: 'https://m.media-amazon.com/images/I/71AEchV3YiL._UF1000,1000_QL80_.jpg',
        link: 'https://open.spotify.com/album/6ELurkxQnAif7u5Vv6Wly9?si=JqK7mDgvQJaXcQ64nkYyYA&utm_source=copy-link',
        status: 'ACTIVO',
        added_by: 'Devie',
        added_by_email: 'devshtp24@gmail.com',
        created_at: '2026-07-13T21:57:18'
    },
    {
        album_name: 'WHAT HAVE WE DONE',
        artist_name: 'pH-1',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/09a9157913ade51c21fbfd65d290275b/0x1900-000000-80-0-0.jpg',
        link: 'https://music.apple.com/mx/album/what-have-we-done/1831215497?l=en-GB',
        status: 'ACTIVO',
        added_by: 'Sora',
        added_by_email: 'carcar.welsh@gmail.com',
        created_at: '2026-07-13T23:13:46'
    },
    {
        album_name: "You Won't Go Before You're Supposed To",
        artist_name: 'Knocked Loose',
        image_url: 'https://m.media-amazon.com/images/I/81H4eStQkKL._UF1000,1000_QL80_.jpg',
        link: 'https://music.youtube.com/playlist?list=OLAK5uy_kIKIGNHqZjl6KvbVuKXthqyVxIrSNPuLQ&si=KN_pOt4uit4KyWaK',
        status: 'ACTIVO',
        added_by: 'Cait',
        added_by_email: 'ricardodg351@gmail.com',
        created_at: '2026-07-13T23:17:40'
    },
    {
        album_name: 'Todos mueren en abril',
        artist_name: 'Todos mueren en abril',
        image_url: 'https://f4.bcbits.com/img/a2388808134_16.jpg',
        link: 'https://open.spotify.com/album/2G5QtcVV7taTm2QQ5X494h?si=T-YVeJouRhSG-PHKrYUY0A&utm_source=copy-link',
        status: 'ACTIVO',
        added_by: 'Abel',
        added_by_email: 'abel.leiva@hotmail.com',
        created_at: '2026-07-13T23:18:11'
    },
    {
        album_name: 'Ashlyn',
        artist_name: 'Ashe',
        image_url: 'https://m.media-amazon.com/images/I/51o5v1sJ3TS.jpg',
        link: 'https://open.spotify.com/album/57KvhLdbABnDYcOZ6l1FWJ?si=xxJQBjPmS0aFvbndz9OuTA&utm_source=copy-link',
        status: 'ACTIVO',
        added_by: 'Oscar',
        added_by_email: 'oscaridrogo13@gmail.com',
        created_at: '2026-07-13T23:20:03'
    },
    {
        album_name: 'Anela',
        artist_name: 'Belen Aguilera',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/a12246329e5c94d53ee9b594dfb94acc/0x1900-000000-80-0-0.jpg',
        link: 'https://open.spotify.com/album/5C2zOhaZpSXcxyzyeHq8MW?si=htaL4XY9SGa0ZNAEqbXLhQ',
        status: 'ACTIVO',
        added_by: 'Kraken',
        added_by_email: 'kraken209254@gmail.com',
        created_at: '2026-07-13T23:40:36'
    },
    {
        album_name: 'La grasa de las capitales',
        artist_name: 'Serú Girán',
        image_url: 'https://www.musiclab.mx/cdn/shop/products/KZY7N47W3NHGZPIQJ7QCOHTUOY.jpg?v=1620081850',
        link: 'https://open.spotify.com/track/5jTPNLIKppok9ABdkdpTxb?si=TGLLgiBpS-2vNTCCkH80cQ&utm_source=copy-link',
        status: 'INACTIVO',
        added_by: 'Alfredo',
        added_by_email: 'alfredoescamilla8582@gmail.com',
        created_at: '2026-07-14T08:14:38'
    },
    {
        album_name: 'Lahai',
        artist_name: 'Sampha',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/ba7baa737fe4f9110d26fdec3d2d0105/1900x1900-000000-80-0-0.jpg',
        link: 'https://open.spotify.com/album/5GuWww4OaildzkmTTlfMN3?si=1TV2VJrESE-6BGWxjrmY4Q&utm_source=copy-link',
        status: 'INACTIVO',
        added_by: 'Valentín',
        added_by_email: 'valentihdz28@gmail.com',
        created_at: '2026-07-14T09:06:25'
    },
    {
        album_name: 'Love Deluxe',
        artist_name: 'Sade',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/975b8e921822b6e01de1663ef02cee08/0x1900-000000-80-0-0.jpg',
        link: 'https://open.spotify.com/intl-es/album/2PfGKHtqEX58bHtkQxJnWG?si=qFEshxEoTY27FysHSTUdWg',
        status: 'INACTIVO',
        added_by: 'Eugenio',
        added_by_email: 'eugenioturcott@gmail.com',
        created_at: '2026-07-24T10:17:02'
    },
    {
        album_name: 'Smile! :D',
        artist_name: 'Porter Robinson',
        image_url: 'https://media.pitchfork.com/photos/66744e4d0a6af003506741ee/1:1/w_450%2Cc_limit/Porter%2520Robinson-%2520Smile%2520-D.jpg',
        link: 'https://open.spotify.com/album/7qx3Q51nfQvkEHIREiTRCO?si=HNhcf7muSmqpWkqaVXYQoQ&utm_source=copy-link',
        status: 'ACTIVO',
        added_by: 'Cristina',
        added_by_email: 'roberto.roll.95@gmail.com',
        created_at: '2026-07-14T22:12:15'
    },
    {
        album_name: 'CHILDSTAR',
        artist_name: 'DANNA',
        image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZvvEs7KO9SvEQj4CZG33z173qZQ1hRXA4L8iBJmw7j-1EYGDDSveus8Q&s=10',
        link: 'https://open.spotify.com/album/7HgMhV3EUrhCvEWgwNzdYH?si=JlZIQ2QWQPGy64Xx4cMcsw&utm_source=copy-link',
        status: 'ACTIVO',
        added_by: 'Yayo',
        added_by_email: 'elojobueno69@gmail.com',
        created_at: '2026-07-14T22:16:41'
    },
    {
        album_name: 'Marchita',
        artist_name: 'Silvana Estrada',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/917a0d141a080dc9c6ec69bbedbaef51/0x1900-000000-80-0-0.jpg',
        link: 'https://open.spotify.com/album/2fvOC8dzZ0BMVzCG6X2g7Y?si=LaUQ_6kUQ5-43wo3npoV7Q&utm_source=copy-link',
        status: 'ACTIVO',
        added_by: 'Ann',
        added_by_email: 'karlamdzav@gmail.com',
        created_at: '2026-07-15T10:30:52'
    },
    {
        album_name: 'Harry styles',
        artist_name: 'Harry styles',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/a41167cfcc7e840821fad5f5f5f91da2/1900x1900-000000-80-0-0.jpg',
        link: 'https://music.youtube.com/playlist?list=OLAK5uy_nY8rMT2-JM5ftt_M8I6uoTcDrsASzjV7w&si=SZTzGYR1woVoAIHo',
        status: 'ACTIVO',
        added_by: 'Daniela Kings',
        added_by_email: 'danielarimq@gmail.com',
        created_at: '2026-08-01T21:50:24'
    },
    {
        album_name: '#CONTRACUERPOS',
        artist_name: 'Lucas Gael',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/dbd1d76e565a54f8cf88c24e36755b46/0x1900-000000-80-0-0.jpg',
        link: 'https://open.spotify.com/album/61DSTLiwVb9BcoA6T151jj?si=6KtUcDpHSMWIArSIlMBdaw&utm_source=copy-link',
        status: 'ACTIVO',
        added_by: 'Rolis',
        added_by_email: 'ronaldoplay4pro@gmail.com',
        created_at: '2026-07-15T10:57:32'
    },
    {
        album_name: 'Tango Astral',
        artist_name: 'Tango Astral',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/d33214ee300155750a61ba693db5ee2a/1900x1900-000000-80-0-0.jpg',
        link: 'https://music.youtube.com/playlist?list=OLAK5uy_m_Qjp7HA0BwPBrRnxs7Fyi5_owUnx_KnA&si=KtlFYezSiOKs_QSM',
        status: 'ACTIVO',
        added_by: 'Caldito',
        added_by_email: 'adperezglzz@gmail.com',
        created_at: '2026-07-15T10:59:41'
    },
    {
        album_name: 'Titanic Rising',
        artist_name: 'Weyes Blood',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/f2edcff8208b6c8aeb2dccff39209043/1900x1900-000000-80-0-0.jpg',
        link: 'https://music.youtube.com/playlist?list=OLAK5uy_mtC3rfG4baRAWpRnlgWh2HnireB1MO8ok&si=IYp-wbooPdCfiiN0',
        status: 'INACTIVO',
        added_by: 'Cait',
        added_by_email: 'ricardodg351@gmail.com',
        created_at: '2026-07-07T18:36:25'
    },
    {
        album_name: 'Bodhiria',
        artist_name: 'Judeline',
        image_url: 'https://cdn-images.dzcdn.net/images/cover/a1041dd029a6ac9dd7eeb9f51c99517c/0x1900-000000-80-0-0.jpg',
        link: 'https://open.spotify.com/album/3fVXh36WypsZR2JGathvkq?si=mx8F_rKKT3GTmJLkF9qvSA&utm_source=copy-link',
        status: 'INACTIVO',
        added_by: 'Valentín',
        added_by_email: 'valentihdz28@gmail.com',
        created_at: '2026-07-07T21:53:35'
    }
];

// Exportar la función
export async function migrateAlbums() {
    console.log('🚀 Iniciando migración de álbumes...');

    let successCount = 0;
    let errorCount = 0;

    for (const album of albumsData) {
        try {
            const { error } = await supabase
                .from('albums')
                .upsert(
                    {
                        album_name: album.album_name,
                        artist_name: album.artist_name,
                        image_url: album.image_url,
                        status: album.status || 'ACTIVO',
                        added_by: album.added_by,
                        added_by_email: album.added_by_email,
                        created_at: album.created_at,
                        spotify_link: album.link?.includes('spotify') ? album.link : null,
                        youtube_link: album.link?.includes('youtube') ? album.link : null,
                        apple_music_link: album.link?.includes('apple') ? album.link : null
                    },
                    { onConflict: 'album_name, artist_name' }
                );

            if (error) {
                console.error(`❌ Error con ${album.album_name}:`, error.message);
                errorCount++;
            } else {
                console.log(`✅ Migrado: ${album.album_name} (${album.artist_name})`);
                successCount++;
            }
        } catch (error) {
            console.error(`❌ Error inesperado con ${album.album_name}:`, error);
            errorCount++;
        }
    }

    console.log(`\n📊 Resumen migración álbumes:`);
    console.log(`   ✅ Éxitos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
}

// Si quieres ejecutar el script directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateAlbums();
}