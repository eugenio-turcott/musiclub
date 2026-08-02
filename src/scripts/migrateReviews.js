// src/scripts/migrateReviews.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = 'https://nzsuxrycbywbdyidvsfl.supabase.co';
const supabaseKey = 'sb_secret_PeXf7FK1XEqIqPUIWFsmGA_vTELlo9j';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeo de álbumes con sus nombres exactos como están en los datos
const ALBUM_MAP = {
    'Titanic Rising': { album_name: 'Titanic Rising', artist_name: 'Weyes Blood' },
    'Bodhiria': { album_name: 'Bodhiria', artist_name: 'Judeline' },
    'La Grasa de las Capitales': { album_name: 'La grasa de las capitales', artist_name: 'Serú Girán' },
    'Love Deluxe': { album_name: 'Love Deluxe', artist_name: 'Sade' },
    'Disco de Oro': { album_name: 'Disco de Oro', artist_name: 'Little Jesus' },
    'Lahai': { album_name: 'Lahai', artist_name: 'Sampha' }
};

// Datos de reviews - Titanic Rising
const titanicRisingReviews = [
    {
        timestamp: '2026-07-11T09:06:19',
        email: 'ricardodg351@gmail.com',
        name: 'Cait',
        track_ratings: {
            "A Lot's Gonna Change": 10,
            "Andromeda": 10,
            "Everyday": 10,
            "Something to Believe": 9,
            "Titanic Rising": 7,
            "Movies": 7,
            "Mirror Forever": 8,
            "Wild Time": 10,
            "Picture Me Better": 10,
            "Nearer to Thee": 7
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 9
    },
    {
        timestamp: '2026-07-11T15:56:39',
        email: 'eugenioturcott@gmail.com',
        name: 'Eugenio',
        track_ratings: {
            "A Lot's Gonna Change": 9,
            "Andromeda": 10,
            "Everyday": 9,
            "Something to Believe": 9,
            "Titanic Rising": 10,
            "Movies": 10,
            "Mirror Forever": 8,
            "Wild Time": 10,
            "Picture Me Better": 9,
            "Nearer to Thee": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 4,
        rating_cohesion: 5,
        rating_replay: 3,
        rating_general: 8
    }
];

// Datos de reviews - Bodhiria
const bodhiriaReviews = [
    {
        timestamp: '2026-07-11T16:54:43',
        email: 'abel.leiva@hotmail.com',
        name: 'Abel',
        track_ratings: {
            "bodhitale": 7, "INRI": 9, "angelA": 7, "mangata": 8,
            "BRUJERIA!": 6, "luna roja": 6, "JOROPO": 7, "4esquinitas": 7,
            "4 angelitos": 8, "Heavenly": 7, "zarcillos de plata": 5,
            "Es Dios bueno o sólo es poderoso": 9
        },
        rating_produccion: 5,
        rating_composicion: 4,
        rating_letras: 3,
        rating_originalidad: 4,
        rating_cohesion: 4,
        rating_replay: 2,
        rating_general: 8
    },
    {
        timestamp: '2026-07-11T16:56:55',
        email: 'eugenioturcott@gmail.com',
        name: 'Eugenio',
        track_ratings: {
            "bodhitale": 10, "INRI": 10, "angelA": 10, "mangata": 10,
            "BRUJERIA!": 10, "luna roja": 10, "JOROPO": 10, "4esquinitas": 9,
            "4 angelitos": 10, "Heavenly": 10, "zarcillos de plata": 9,
            "Es Dios bueno o sólo es poderoso": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-07-11T17:00:12',
        email: 'dev.vzz99@gmail.com',
        name: 'Devie',
        track_ratings: {
            "bodhitale": 7, "INRI": 9, "angelA": 10, "mangata": 6,
            "BRUJERIA!": 10, "luna roja": 8, "JOROPO": 6, "4esquinitas": 7,
            "4 angelitos": 10, "Heavenly": 10, "zarcillos de plata": 5,
            "Es Dios bueno o sólo es poderoso": 6
        },
        rating_produccion: 3,
        rating_composicion: 3,
        rating_letras: 4,
        rating_originalidad: 3,
        rating_cohesion: 2,
        rating_replay: 2,
        rating_general: 7
    },
    {
        timestamp: '2026-07-11T17:00:12',
        email: 'ricardodg351@gmail.com',
        name: 'Cait',
        track_ratings: {
            "bodhitale": 10, "INRI": 10, "angelA": 8, "mangata": 10,
            "BRUJERIA!": 9, "luna roja": 10, "JOROPO": 10, "4esquinitas": 8,
            "4 angelitos": 9, "Heavenly": 10, "zarcillos de plata": 7,
            "Es Dios bueno o sólo es poderoso": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-07-11T17:06:37',
        email: 'yahir.galvanr@outlook.com',
        name: 'Yahir Galvanizado Roncha',
        track_ratings: {
            "bodhitale": 8, "INRI": 9, "angelA": 9, "mangata": 8,
            "BRUJERIA!": 8, "luna roja": 8, "JOROPO": 10, "4esquinitas": 8,
            "4 angelitos": 9, "Heavenly": 10, "zarcillos de plata": 10,
            "Es Dios bueno o sólo es poderoso": 8
        },
        rating_produccion: 5,
        rating_composicion: 4,
        rating_letras: 5,
        rating_originalidad: 4,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-07-11T17:07:31',
        email: 'alfredoescamilla8582@gmail.com',
        name: 'Alfredo',
        track_ratings: {
            "bodhitale": 7, "INRI": 8, "angelA": 7, "mangata": 7,
            "BRUJERIA!": 8, "luna roja": 8, "JOROPO": 10, "4esquinitas": 7,
            "4 angelitos": 10, "Heavenly": 9, "zarcillos de plata": 10,
            "Es Dios bueno o sólo es poderoso": 7
        },
        rating_produccion: 5,
        rating_composicion: 4,
        rating_letras: 2,
        rating_originalidad: 3,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 8
    },
    {
        timestamp: '2026-07-11T17:16:06',
        email: 'karlamdzav@gmail.com',
        name: 'Ann',
        track_ratings: {
            "bodhitale": 10, "INRI": 5, "angelA": 5, "mangata": 5,
            "BRUJERIA!": 9, "luna roja": 7, "JOROPO": 10, "4esquinitas": 7,
            "4 angelitos": 7, "Heavenly": 7, "zarcillos de plata": 9,
            "Es Dios bueno o sólo es poderoso": 10
        },
        rating_produccion: 4,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 3,
        rating_cohesion: 4,
        rating_replay: 4,
        rating_general: 7
    },
    {
        timestamp: '2026-07-11T17:41:33',
        email: 'valentin_5@live.com.mx',
        name: 'Valentín',
        track_ratings: {
            "bodhitale": 8, "INRI": 8, "angelA": 10, "mangata": 8,
            "BRUJERIA!": 10, "luna roja": 7, "JOROPO": 8, "4esquinitas": 7,
            "4 angelitos": 6, "Heavenly": 9, "zarcillos de plata": 9,
            "Es Dios bueno o sólo es poderoso": 8
        },
        rating_produccion: 5,
        rating_composicion: 4,
        rating_letras: 4,
        rating_originalidad: 3,
        rating_cohesion: 4,
        rating_replay: 4,
        rating_general: 9
    }
];

// Datos de reviews - La Grasa de las Capitales
const grasareviews = [
    {
        timestamp: '2026-07-20T20:46:25',
        email: 'dev.vzz99@gmail.com',
        name: 'Devie',
        track_ratings: {
            "La Grasa de las Capitales": 7,
            "San Francisco y el Lobo": 9,
            "Perro Andaluz": 8,
            "Frecuencia Modulada": 10,
            "Viernes, 3AM": 8,
            "Noche de Perros": 8,
            "Los Sobrevivientes": 9,
            "Paranoia y Soledad": 9,
            "Canción de Hollywood": 9
        },
        rating_produccion: 4,
        rating_composicion: 4,
        rating_letras: 5,
        rating_originalidad: 4,
        rating_cohesion: 3,
        rating_replay: 4,
        rating_general: 8
    },
    {
        timestamp: '2026-07-20T21:06:28',
        email: 'jesusroberto005@gmail.com',
        name: 'Jesurro Berto',
        track_ratings: {
            "La Grasa de las Capitales": 3,
            "San Francisco y el Lobo": 4,
            "Perro Andaluz": 9,
            "Frecuencia Modulada": 9,
            "Viernes, 3AM": 6,
            "Noche de Perros": 9,
            "Los Sobrevivientes": 7,
            "Paranoia y Soledad": 5,
            "Canción de Hollywood": 9
        },
        rating_produccion: 4,
        rating_composicion: 5,
        rating_letras: 3,
        rating_originalidad: 4,
        rating_cohesion: 5,
        rating_replay: 3,
        rating_general: 8
    },
    {
        timestamp: '2026-07-20T21:07:32',
        email: 'tadeoemiliano@hotmail.com',
        name: 'Tadeo',
        track_ratings: {
            "La Grasa de las Capitales": 9,
            "San Francisco y el Lobo": 8,
            "Perro Andaluz": 8,
            "Frecuencia Modulada": 7,
            "Viernes, 3AM": 8,
            "Noche de Perros": 8,
            "Los Sobrevivientes": 10,
            "Paranoia y Soledad": 4,
            "Canción de Hollywood": 3
        },
        rating_produccion: 4,
        rating_composicion: 5,
        rating_letras: 2,
        rating_originalidad: 3,
        rating_cohesion: 5,
        rating_replay: 1,
        rating_general: 8
    },
    {
        timestamp: '2026-07-20T21:07:49',
        email: 'eugenioturcott@gmail.com',
        name: 'Eugenio',
        track_ratings: {
            "La Grasa de las Capitales": 10,
            "San Francisco y el Lobo": 7,
            "Perro Andaluz": 10,
            "Frecuencia Modulada": 10,
            "Viernes, 3AM": 8,
            "Noche de Perros": 8,
            "Los Sobrevivientes": 8,
            "Paranoia y Soledad": 9,
            "Canción de Hollywood": 9
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 4,
        rating_cohesion: 4,
        rating_replay: 4,
        rating_general: 9
    },
    {
        timestamp: '2026-07-20T21:09:57',
        email: 'abel.leiva@hotmail.com',
        name: 'Abel',
        track_ratings: {
            "La Grasa de las Capitales": 10,
            "San Francisco y el Lobo": 8,
            "Perro Andaluz": 8,
            "Frecuencia Modulada": 9,
            "Viernes, 3AM": 8,
            "Noche de Perros": 8,
            "Los Sobrevivientes": 9,
            "Paranoia y Soledad": 8,
            "Canción de Hollywood": 8
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 3,
        rating_originalidad: 4,
        rating_cohesion: 4,
        rating_replay: 2,
        rating_general: 8
    },
    {
        timestamp: '2026-07-20T21:12:42',
        email: 'oscaridrogo13@gmail.com',
        name: 'Oscar Gael González Idrogo',
        track_ratings: {
            "La Grasa de las Capitales": 9,
            "San Francisco y el Lobo": 6,
            "Perro Andaluz": 8,
            "Frecuencia Modulada": 9,
            "Viernes, 3AM": 5,
            "Noche de Perros": 5,
            "Los Sobrevivientes": 7,
            "Paranoia y Soledad": 8,
            "Canción de Hollywood": 7
        },
        rating_produccion: 4,
        rating_composicion: 5,
        rating_letras: 3,
        rating_originalidad: 4,
        rating_cohesion: 5,
        rating_replay: 2,
        rating_general: 8
    },
    {
        timestamp: '2026-07-20T21:14:18',
        email: 'ricardodg351@gmail.com',
        name: 'Cait',
        track_ratings: {
            "La Grasa de las Capitales": 9,
            "San Francisco y el Lobo": 9,
            "Perro Andaluz": 10,
            "Frecuencia Modulada": 10,
            "Viernes, 3AM": 10,
            "Noche de Perros": 10,
            "Los Sobrevivientes": 8,
            "Paranoia y Soledad": 9,
            "Canción de Hollywood": 9
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-07-20T21:15:43',
        email: 'ronaldo.balderas@icloud.com',
        name: 'Ronaldo Balderas',
        track_ratings: {
            "La Grasa de las Capitales": 7,
            "San Francisco y el Lobo": 5,
            "Perro Andaluz": 10,
            "Frecuencia Modulada": 9,
            "Viernes, 3AM": 8,
            "Noche de Perros": 6,
            "Los Sobrevivientes": 5,
            "Paranoia y Soledad": 6,
            "Canción de Hollywood": 5
        },
        rating_produccion: 4,
        rating_composicion: 3,
        rating_letras: 2,
        rating_originalidad: 4,
        rating_cohesion: 4,
        rating_replay: 2,
        rating_general: 7
    },
    {
        timestamp: '2026-07-20T21:16:54',
        email: 'alfredoescamilla8582@gmail.com',
        name: 'Alfredo',
        track_ratings: {
            "La Grasa de las Capitales": 10,
            "San Francisco y el Lobo": 9,
            "Perro Andaluz": 10,
            "Frecuencia Modulada": 10,
            "Viernes, 3AM": 10,
            "Noche de Perros": 10,
            "Los Sobrevivientes": 8,
            "Paranoia y Soledad": 10,
            "Canción de Hollywood": 8
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-07-20T21:17:07',
        email: 'valentin_5@live.com.mx',
        name: 'Valentin',
        track_ratings: {
            "La Grasa de las Capitales": 8,
            "San Francisco y el Lobo": 7,
            "Perro Andaluz": 8,
            "Frecuencia Modulada": 10,
            "Viernes, 3AM": 8,
            "Noche de Perros": 6,
            "Los Sobrevivientes": 7,
            "Paranoia y Soledad": 9,
            "Canción de Hollywood": 8
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 3,
        rating_originalidad: 3,
        rating_cohesion: 1,
        rating_replay: 3,
        rating_general: 8
    },
    {
        timestamp: '2026-07-20T21:18:07',
        email: 'karlamdzav@gmail.com',
        name: 'Ann',
        track_ratings: {
            "La Grasa de las Capitales": 10,
            "San Francisco y el Lobo": 10,
            "Perro Andaluz": 9,
            "Frecuencia Modulada": 10,
            "Viernes, 3AM": 8,
            "Noche de Perros": 9,
            "Los Sobrevivientes": 10,
            "Paranoia y Soledad": 10,
            "Canción de Hollywood": 8
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 4,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 9
    }
];

// Datos de reviews - Love Deluxe
const loveDeluxeReviews = [
    {
        timestamp: '2026-07-26T21:42:31',
        email: 'eugenioturcott@gmail.com',
        name: 'Eugenio',
        track_ratings: {
            "No Ordinary Love": 10,
            "Feel No Pain": 10,
            "I Couldn't Love You More": 10,
            "Like a Tattoo": 10,
            "Kiss of Life": 10,
            "Cherish the Day": 10,
            "Pearls": 10,
            "Bullet Proof Soul": 10,
            "Mermaid": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-07-26T21:48:53',
        email: 'tadeoemiliano@hotmail.com',
        name: 'Tadeo',
        track_ratings: {
            "No Ordinary Love": 8,
            "Feel No Pain": 8,
            "I Couldn't Love You More": 7,
            "Like a Tattoo": 6,
            "Kiss of Life": 9,
            "Cherish the Day": 9,
            "Pearls": 10,
            "Bullet Proof Soul": 8,
            "Mermaid": 8
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 3,
        rating_cohesion: 4,
        rating_replay: 1,
        rating_general: 9
    },
    {
        timestamp: '2026-07-26T21:49:00',
        email: 'oscaridrogo13@gmail.com',
        name: 'Oscar Gael González Idrogo',
        track_ratings: {
            "No Ordinary Love": 9,
            "Feel No Pain": 10,
            "I Couldn't Love You More": 10,
            "Like a Tattoo": 9,
            "Kiss of Life": 8,
            "Cherish the Day": 8,
            "Pearls": 9,
            "Bullet Proof Soul": 10,
            "Mermaid": 8
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 4,
        rating_replay: 4,
        rating_general: 9
    },
    {
        timestamp: '2026-07-26T21:49:02',
        email: 'dev.vzz99@gmail.com',
        name: 'Devie',
        track_ratings: {
            "No Ordinary Love": 7,
            "Feel No Pain": 1,
            "I Couldn't Love You More": 1,
            "Like a Tattoo": 7,
            "Kiss of Life": 9,
            "Cherish the Day": 9,
            "Pearls": 10,
            "Bullet Proof Soul": 9,
            "Mermaid": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 2,
        rating_cohesion: 4,
        rating_replay: 4,
        rating_general: 9
    },
    {
        timestamp: '2026-07-26T21:50:25',
        email: 'ricardodg351@gmail.com',
        name: 'Cait',
        track_ratings: {
            "No Ordinary Love": 10,
            "Feel No Pain": 10,
            "I Couldn't Love You More": 9,
            "Like a Tattoo": 10,
            "Kiss of Life": 9,
            "Cherish the Day": 7,
            "Pearls": 10,
            "Bullet Proof Soul": 9,
            "Mermaid": 8
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 4,
        rating_replay: 5,
        rating_general: 9
    },
    {
        timestamp: '2026-07-26T21:50:36',
        email: 'ronaldoplay4pro@gmail.com',
        name: 'Ronaldo Balderas',
        track_ratings: {
            "No Ordinary Love": 8,
            "Feel No Pain": 10,
            "I Couldn't Love You More": 8,
            "Like a Tattoo": 10,
            "Kiss of Life": 7,
            "Cherish the Day": 10,
            "Pearls": 3,
            "Bullet Proof Soul": 6,
            "Mermaid": 6
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-07-26T22:04:17',
        email: 'jesusroberto005@gmail.com',
        name: 'JeSURROberto',
        track_ratings: {
            "No Ordinary Love": 7,
            "Feel No Pain": 8,
            "I Couldn't Love You More": 7,
            "Like a Tattoo": 7,
            "Kiss of Life": 9,
            "Cherish the Day": 8,
            "Pearls": 7,
            "Bullet Proof Soul": 10,
            "Mermaid": 9
        },
        rating_produccion: 5,
        rating_composicion: 4,
        rating_letras: 4,
        rating_originalidad: 3,
        rating_cohesion: 4,
        rating_replay: 3,
        rating_general: 8
    }
];

// Datos de reviews - Disco de Oro
const discoDeOroReviews = [
    {
        timestamp: '2026-08-01T19:26:10',
        email: 'danieladeya@hotmail.com',
        name: 'Daniela',
        track_ratings: {
            "Los Años Maravillosos": 7,
            "Fuera de Lugar": 10,
            "Los Ángeles, California": 8,
            "Un Plan Espectacular": 9,
            "Volver al Futuro": 10,
            "Duro de Matar": 9,
            "Disco de Oro": 9,
            "Ahí Te Ves": 8,
            "Cine Permanencia Voluntaria": 7,
            "Gracias por Nada": 8,
            "En Otro Planeta": 7,
            "Video Club Amores": 10,
            "Copa del Mundo": 6
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 3,
        rating_originalidad: 3,
        rating_cohesion: 5,
        rating_replay: 4,
        rating_general: 8
    },
    {
        timestamp: '2026-08-01T19:26:49',
        email: 'jesusroberto005@gmail.com',
        name: 'JesurroBerto Sandoval UrbANO',
        track_ratings: {
            "Los Años Maravillosos": 10,
            "Fuera de Lugar": 9,
            "Los Ángeles, California": 10,
            "Un Plan Espectacular": 10,
            "Volver al Futuro": 10,
            "Duro de Matar": 8,
            "Disco de Oro": 10,
            "Ahí Te Ves": 8,
            "Cine Permanencia Voluntaria": 10,
            "Gracias por Nada": 10,
            "En Otro Planeta": 10,
            "Video Club Amores": 7,
            "Copa del Mundo": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-08-01T19:27:03',
        email: 'oscaridrogo13@gmail.com',
        name: 'Oscar Gael González Idrogo',
        track_ratings: {
            "Los Años Maravillosos": 9,
            "Fuera de Lugar": 8,
            "Los Ángeles, California": 8,
            "Un Plan Espectacular": 10,
            "Volver al Futuro": 9,
            "Duro de Matar": 8,
            "Disco de Oro": 9,
            "Ahí Te Ves": 10,
            "Cine Permanencia Voluntaria": 9,
            "Gracias por Nada": 7,
            "En Otro Planeta": 8,
            "Video Club Amores": 8,
            "Copa del Mundo": 7
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 4,
        rating_cohesion: 5,
        rating_replay: 4,
        rating_general: 9
    },
    {
        timestamp: '2026-08-01T19:27:06',
        email: 'alfredoescamilla8582@gmail.com',
        name: 'Alfredo',
        track_ratings: {
            "Los Años Maravillosos": 10,
            "Fuera de Lugar": 10,
            "Los Ángeles, California": 10,
            "Un Plan Espectacular": 10,
            "Volver al Futuro": 10,
            "Duro de Matar": 10,
            "Disco de Oro": 10,
            "Ahí Te Ves": 9,
            "Cine Permanencia Voluntaria": 10,
            "Gracias por Nada": 10,
            "En Otro Planeta": 10,
            "Video Club Amores": 9,
            "Copa del Mundo": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-08-01T19:27:19',
        email: 'ronaldoplay4pro@gmail.com',
        name: 'Ronaldo',
        track_ratings: {
            "Los Años Maravillosos": 10,
            "Fuera de Lugar": 10,
            "Los Ángeles, California": 10,
            "Un Plan Espectacular": 7,
            "Volver al Futuro": 10,
            "Duro de Matar": 10,
            "Disco de Oro": 9,
            "Ahí Te Ves": 6,
            "Cine Permanencia Voluntaria": 8,
            "Gracias por Nada": 10,
            "En Otro Planeta": 8,
            "Video Club Amores": 9,
            "Copa del Mundo": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 5,
        rating_cohesion: 5,
        rating_replay: 5,
        rating_general: 10
    },
    {
        timestamp: '2026-08-01T19:27:35',
        email: 'valentihdz28@gmail.com',
        name: 'Valentín',
        track_ratings: {
            "Los Años Maravillosos": 7,
            "Fuera de Lugar": 10,
            "Los Ángeles, California": 8,
            "Un Plan Espectacular": 8,
            "Volver al Futuro": 10,
            "Duro de Matar": 5,
            "Disco de Oro": 8,
            "Ahí Te Ves": 4,
            "Cine Permanencia Voluntaria": 9,
            "Gracias por Nada": 10,
            "En Otro Planeta": 9,
            "Video Club Amores": 8,
            "Copa del Mundo": 7
        },
        rating_produccion: 4,
        rating_composicion: 3,
        rating_letras: 4,
        rating_originalidad: 4,
        rating_cohesion: 2,
        rating_replay: 3,
        rating_general: 8
    },
    {
        timestamp: '2026-08-01T19:29:24',
        email: 'eugenioturcott@gmail.com',
        name: 'Eugenio',
        track_ratings: {
            "Los Años Maravillosos": 10,
            "Fuera de Lugar": 10,
            "Los Ángeles, California": 9,
            "Un Plan Espectacular": 10,
            "Volver al Futuro": 10,
            "Duro de Matar": 10,
            "Disco de Oro": 10,
            "Ahí Te Ves": 9,
            "Cine Permanencia Voluntaria": 9,
            "Gracias por Nada": 10,
            "En Otro Planeta": 9,
            "Video Club Amores": 9,
            "Copa del Mundo": 10
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 4,
        rating_originalidad: 5,
        rating_cohesion: 4,
        rating_replay: 5,
        rating_general: 10
    }
];

// Datos de reviews - Lahai
const lahaiReviews = [
    {
        timestamp: '2026-08-01T22:09:53',
        email: 'jesusroberto005@gmail.com',
        name: 'JesuRROberto Sandoval Urbano',
        track_ratings: {
            "Stereo Coloured Cloud (Shaman's Dream)": 9,
            "Spirit 2.0": 8,
            "Dancing Circles": 9,
            "Suspended": 8,
            "Satellite Business": 10,
            "Jonathan L. Seagull": 9,
            "Inclination Compass (Tenderness)": 8,
            "Only": 10,
            "Time Piece": 8,
            "Can't Go Back": 9,
            "Evidence": 10,
            "Wave Therapy": 8,
            "What If You Hypnotise Me?": 8,
            "Rose Tint": 9
        },
        rating_produccion: 5,
        rating_composicion: 4,
        rating_letras: 4,
        rating_originalidad: 5,
        rating_cohesion: 4,
        rating_replay: 4,
        rating_general: 9
    },
    {
        timestamp: '2026-08-01T22:10:14',
        email: 'alfredoescamilla8582@gmail.com',
        name: 'Alfredo',
        track_ratings: {
            "Stereo Coloured Cloud (Shaman's Dream)": 8,
            "Spirit 2.0": 9,
            "Dancing Circles": 9,
            "Suspended": 9,
            "Satellite Business": 10,
            "Jonathan L. Seagull": 9,
            "Inclination Compass (Tenderness)": 10,
            "Only": 9,
            "Time Piece": 10,
            "Can't Go Back": 9,
            "Evidence": 8,
            "Wave Therapy": 10,
            "What If You Hypnotise Me?": 10,
            "Rose Tint": 10
        },
        rating_produccion: 5,
        rating_composicion: 4,
        rating_letras: 3,
        rating_originalidad: 3,
        rating_cohesion: 4,
        rating_replay: 4,
        rating_general: 8
    },
    {
        timestamp: '2026-08-02T03:52:20',
        email: 'danieldeya@hotmail.com',
        name: 'Daniela',
        track_ratings: {
            "Stereo Coloured Cloud (Shaman's Dream)": 8,
            "Spirit 2.0": 10,
            "Dancing Circles": 10,
            "Suspended": 10,
            "Satellite Business": 9,
            "Jonathan L. Seagull": 8,
            "Inclination Compass (Tenderness)": 8,
            "Only": 9,
            "Time Piece": 8,
            "Can't Go Back": 8,
            "Evidence": 9,
            "Wave Therapy": 8,
            "What If You Hypnotise Me?": 8,
            "Rose Tint": 9
        },
        rating_produccion: 5,
        rating_composicion: 5,
        rating_letras: 5,
        rating_originalidad: 3,
        rating_cohesion: 5,
        rating_replay: 4,
        rating_general: 8
    }
];

// Función para migrar reviews de un álbum
async function migrateAlbumReviews(albumKey, reviewsList) {
    const albumInfo = ALBUM_MAP[albumKey];
    if (!albumInfo) {
        console.error(`❌ Álbum no encontrado en el mapa: ${albumKey}`);
        return { success: 0, errors: 0 };
    }

    console.log(`📝 Migrando reviews para: ${albumKey}...`);

    // Buscar el ID del álbum en la base de datos
    const { data: album, error: albumError } = await supabase
        .from('albums')
        .select('id')
        .eq('album_name', albumInfo.album_name)
        .eq('artist_name', albumInfo.artist_name)
        .single();

    if (albumError || !album) {
        console.error(`❌ Álbum no encontrado: ${albumKey} (${albumInfo.album_name} - ${albumInfo.artist_name})`);
        return { success: 0, errors: 1 };
    }

    let successCount = 0;
    let errorCount = 0;

    for (const review of reviewsList) {
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    album_id: album.id,
                    reviewer_name: review.name,
                    reviewer_email: review.email,
                    created_at: review.timestamp,
                    track_ratings: review.track_ratings,
                    rating_produccion: review.rating_produccion,
                    rating_composicion: review.rating_composicion,
                    rating_letras: review.rating_letras,
                    rating_originalidad: review.rating_originalidad,
                    rating_cohesion: review.rating_cohesion,
                    rating_replay: review.rating_replay,
                    rating_general: review.rating_general,
                    comment: null
                });

            if (error) {
                console.error(`❌ Error en review de ${review.name}:`, error.message);
                errorCount++;
            } else {
                successCount++;
            }
        } catch (error) {
            console.error(`❌ Error inesperado en review de ${review.name}:`, error);
            errorCount++;
        }
    }

    console.log(`   ✅ ${successCount} reviews migradas, ❌ ${errorCount} errores`);
    return { success: successCount, errors: errorCount };
}

// Función principal de migración
export async function migrateAllReviews() {
    console.log('🚀 Iniciando migración de reviews...\n');

    const reviewsToMigrate = [
        { key: 'Titanic Rising', data: titanicRisingReviews },
        { key: 'Bodhiria', data: bodhiriaReviews },
        { key: 'La Grasa de las Capitales', data: grasareviews },
        { key: 'Love Deluxe', data: loveDeluxeReviews },
        { key: 'Disco de Oro', data: discoDeOroReviews },
        { key: 'Lahai', data: lahaiReviews }
    ];

    let totalSuccess = 0;
    let totalErrors = 0;

    for (const { key, data } of reviewsToMigrate) {
        const result = await migrateAlbumReviews(key, data);
        totalSuccess += result.success;
        totalErrors += result.errors;
        console.log('');
    }

    console.log('📊 RESUMEN FINAL:');
    console.log(`   ✅ Reviews migradas: ${totalSuccess}`);
    console.log(`   ❌ Errores: ${totalErrors}`);
    console.log(`   📝 Total: ${totalSuccess + totalErrors}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    migrateAllReviews();
}