// src/services/googleSheetsApi.js

// URL del Google Apps Script que maneja TODO
const GS_API_URL = process.env.REACT_APP_GS_API_URL || 'https://script.google.com/macros/s/TU_SCRIPT_ID/exec';

export const googleSheetsApi = {
    // Buscar si un álbum ya existe en el sistema
    findAlbum: async (albumName, artistName) => {
        try {
            const response = await fetch(
                `${GS_API_URL}?action=findAlbum&album=${encodeURIComponent(albumName)}&artist=${encodeURIComponent(artistName)}`
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en findAlbum:', error);
            return { success: false, error: error.message };
        }
    },

    // Obtener todas las reviews de un álbum
    getReviews: async (albumName, artistName) => {
        try {
            const response = await fetch(
                `${GS_API_URL}?action=getReviews&album=${encodeURIComponent(albumName)}&artist=${encodeURIComponent(artistName)}`
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en getReviews:', error);
            return { success: false, error: error.message };
        }
    },

    // Crear un nuevo álbum en el sistema
    createAlbum: async (albumData) => {
        try {
            const response = await fetch(GS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'createAlbum',
                    ...albumData
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en createAlbum:', error);
            return { success: false, error: error.message };
        }
    },

    // Agregar una review a un álbum existente
    addReview: async (reviewData) => {
        try {
            const response = await fetch(GS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addReview',
                    ...reviewData
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en addReview:', error);
            return { success: false, error: error.message };
        }
    },

    // Obtener todos los álbumes del sistema
    getAllAlbums: async () => {
        try {
            const response = await fetch(`${GS_API_URL}?action=getAllAlbums`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en getAllAlbums:', error);
            return { success: false, error: error.message };
        }
    }
};