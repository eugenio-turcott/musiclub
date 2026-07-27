// src/services/api.js
import { googleSheetsApi } from './googleSheetsApi';

// URL del Google Apps Script (la misma que usas en googleSheetsApi)
const GS_API_URL = process.env.REACT_APP_GS_API_URL || 'https://script.google.com/macros/s/TU_SCRIPT_ID/exec';

export const albumsApi = {
  getActiveAlbums: async () => {
    try {
      const result = await googleSheetsApi.getAllAlbums();
      if (result.success) {
        return {
          albums: result.data,
          error: null,
        };
      }
      throw new Error(result.error || 'Error al cargar álbumes');
    } catch (error) {
      console.error('Error fetching albums:', error);
      return {
        albums: [],
        error: error.message,
      };
    }
  },

  markAsInactive: async (album, artista) => {
    try {
      const response = await fetch(GS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markInactive',
          album,
          artista
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking album:', error);
      return { success: false, error: error.message };
    }
  },
};

// Exportamos reviewsApi para que los componentes lo usen
export const reviewsApi = {
  // Obtener reviews de un álbum
  getReviews: async (album, artista) => {
    try {
      const result = await googleSheetsApi.getReviews(album, artista);
      return result;
    } catch (error) {
      console.error('Error en getReviews:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener reviews de todos los álbumes
  getAllReviews: async (albumList) => {
    try {
      const allReviews = [];
      for (const album of albumList) {
        const result = await googleSheetsApi.getReviews(album.album, album.artista);
        if (result.success && result.data) {
          allReviews.push(...result.data.map(r => ({ ...r, album: album.album, artista: album.artista })));
        }
      }
      return { success: true, data: allReviews };
    } catch (error) {
      console.error('Error en getAllReviews:', error);
      return { success: false, error: error.message };
    }
  },

  // Enviar una review
  submitReview: async (reviewData) => {
    try {
      const result = await googleSheetsApi.addReview(reviewData);
      return result;
    } catch (error) {
      console.error('Error en submitReview:', error);
      return { success: false, error: error.message };
    }
  },
};