// src/services/api.js
const API_URL =
  'https://script.google.com/macros/s/AKfycbwQbAqkWMmIAydRVDliV6heY80s9Gww-y0AUnQBIBF1ADPqhWKfBOXYgrlDqd52B1_B/exec';

export const albumsApi = {
  // Obtener álbumes activos
  getActiveAlbums: async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.success && data.data) {
        return {
          albums: data.data,
          error: null,
        };
      }
      throw new Error('No se pudieron cargar los álbumes');
    } catch (error) {
      console.error('Error fetching albums:', error);
      return {
        albums: [],
        error: error.message,
      };
    }
  },

  // Marcar álbum como inactivo
  markAsInactive: async (album, artista) => {
    try {
      // Eliminar la variable 'response' que no se usa
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ album, artista }),
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking album:', error);
      return { success: false, error: error.message };
    }
  },
};
