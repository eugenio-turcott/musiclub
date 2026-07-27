// src/config/reviewsConfig.js

// Mapeo de álbumes a sus respectivos Google Sheets
// Cuando agregues un nuevo álbum, solo añádelo aquí con su ID de Google Sheet
export const ALBUM_REVIEWS_SOURCES = {
    'Titanic Rising': {
        sheetId: '1ZssSiUkoyYz0quPwyhsaH3dEH8ArgYK5SuKijXp4Dvg',
        artista: 'Weyes Blood',
        // Columnas de calificación en tu Google Sheet
        ratingColumns: {
            'Producción - ¿Qué tan bien producido y trabajado te pareció el álbum?': 'produccion',
            'Composición -  Evalúa la calidad de las melodías y composición musical': 'composicion',
            'Letras - ¿Qué tan buenas y significativas te parecieron las letras?': 'letras',
            'Originalidad - ¿Qué tan único o innovador sentiste este álbum?': 'originalidad',
            'Cohesión del álbum - ¿Las canciones funcionan bien juntas como un solo proyecto?': 'cohesion',
            'Replay Value - ¿Qué tantas ganas te deja de volver a escucharlo?': 'replay',
            'Calificación general - Independientemente de todo lo anterior, ¿qué calificación le das al álbum?': 'general',
        },
        // Columnas de usuario
        userColumns: {
            nombre: 'Nombre',
            email: 'Dirección de correo electrónico',
            timestamp: 'Marca temporal'
        }
    },
    'Bodhiria': {
        sheetId: '1fBfIz8eGqxjqyd-JJeTAAHWYHOQpKFp9UIPEkrYHa0w',
        artista: 'Judeline',
        ratingColumns: {
            'Producción - ¿Qué tan bien producido y trabajado te pareció el álbum?': 'produccion',
            'Composición -  Evalúa la calidad de las melodías y composición musical': 'composicion',
            'Letras - ¿Qué tan buenas y significativas te parecieron las letras?': 'letras',
            'Originalidad - ¿Qué tan único o innovador sentiste este álbum?': 'originalidad',
            'Cohesión del álbum - ¿Las canciones funcionan bien juntas como un solo proyecto?': 'cohesion',
            'Replay Value - ¿Qué tantas ganas te deja de volver a escucharlo?': 'replay',
            'Calificación general - Independientemente de todo lo anterior, ¿qué calificación le das al álbum?': 'general',
        },
        userColumns: {
            nombre: 'Nombre',
            email: 'Dirección de correo electrónico',
            timestamp: 'Marca temporal'
        }
    },
    'La Grasa de las Capitales': {
        sheetId: '1QT9UuUOjfZ2n25hHu60M9SOsq4eyupGylY5TxJ5WGHw',
        artista: 'Serú Girán',
        ratingColumns: {
            'Producción - ¿Qué tan bien producido y trabajado te pareció el álbum?': 'produccion',
            'Composición -  Evalúa la calidad de las melodías y composición musical': 'composicion',
            'Letras - ¿Qué tan buenas y significativas te parecieron las letras?': 'letras',
            'Originalidad - ¿Qué tan único o innovador sentiste este álbum?': 'originalidad',
            'Cohesión del álbum - ¿Las canciones funcionan bien juntas como un solo proyecto?': 'cohesion',
            'Replay Value - ¿Qué tantas ganas te deja de volver a escucharlo?': 'replay',
            'Calificación general - Independientemente de todo lo anterior, ¿qué calificación le das al álbum?': 'general',
        },
        userColumns: {
            nombre: 'Nombre',
            email: 'Dirección de correo electrónico',
            timestamp: 'Marca temporal'
        }
    },
    // 👇 Cuando agregues un nuevo álbum, añádelo aquí:
    // 'Nuevo Álbum': {
    //   sheetId: 'ID_DEL_GOOGLE_SHEET',
    //   artista: 'Nombre del Artista',
    //   ratingColumns: { ... },
    //   userColumns: { ... }
    // }
};

// Función para obtener la URL de exportación CSV
export function getSheetExportUrl(sheetId) {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}`;
}

// Función para parsear CSV a JSON
export function parseCSVtoJSON(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    // Manejar comillas en el CSV
    const parseRow = (row) => {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let char of row) {
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        return values;
    };

    const headers = parseRow(lines[0]);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseRow(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        result.push(row);
    }

    return result;
}

// Función para construir la URL de append para Google Sheets
export function getSheetAppendUrl(sheetId) {
    // Usamos un proxy CORS o un Google Apps Script
    // Por ahora usamos un script de Google Apps Script
    // REEMPLAZA con tu URL de Google Apps Script
    return `https://script.google.com/macros/s/TU_SCRIPT_ID_ESCRITURA/exec?sheetId=${sheetId}`;
}