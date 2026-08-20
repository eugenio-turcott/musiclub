// src/utils/albumDeduplication.test.js
import {
  normalizeAlbumTitle,
  normalizeArtistName,
  isAlbumAlreadyInCatalog,
} from './albumDeduplication';

describe('albumDeduplication', () => {
  describe('normalizeAlbumTitle', () => {
    test('normalizes complex edition titles correctly', () => {
      expect(
        normalizeAlbumTitle(
          'La Grasa de las Capitales: Edición 40º Aniversario (2019 Remasterizado)'
        )
      ).toBe('la grasa de las capitales');

      expect(
        normalizeAlbumTitle('La grasa de las capitales')
      ).toBe('la grasa de las capitales');

      expect(
        normalizeAlbumTitle('Abbey Road (Super Deluxe Edition 2019)')
      ).toBe('abbey road');

      expect(
        normalizeAlbumTitle('The Dark Side of the Moon - 50th Anniversary Remaster')
      ).toBe('the dark side of the moon');

      expect(
        normalizeAlbumTitle('Bocanada (Remasterizado 2015)')
      ).toBe('bocanada');

      expect(
        normalizeAlbumTitle('Random Access Memories (10th Anniversary Edition)')
      ).toBe('random access memories');

      expect(
        normalizeAlbumTitle('Clics Modernos [Edición 40 Años]')
      ).toBe('clics modernos');
    });
  });

  describe('isAlbumAlreadyInCatalog', () => {
    const catalog = [
      {
        id: 'cat-1',
        album_name: 'La grasa de las capitales',
        artist_name: 'Serú Girán',
        status: 'ACTIVO',
      },
      {
        id: 'cat-2',
        album_name: 'OK Computer',
        artist_name: 'Radiohead',
        status: 'GANADOR',
      },
      {
        id: 'cat-3',
        album_name: 'Bocanada',
        artist_name: 'Gustavo Cerati',
        status: 'INDIVIDUAL',
      },
    ];

    test('detects duplicate for La Grasa de las Capitales 40 Aniversario', () => {
      const candidate = {
        id: 'spotify-cand-1',
        name: 'La Grasa de las Capitales: Edición 40º Aniversario (2019 Remasterizado)',
        artists: ['Serú Girán'],
      };
      expect(isAlbumAlreadyInCatalog(candidate, catalog)).toBe(true);
    });

    test('detects duplicate for Bocanada Deluxe/Remaster', () => {
      const candidate = {
        id: 'spotify-cand-2',
        name: 'Bocanada (Remastered 2015)',
        artists: ['Gustavo Cerati'],
      };
      expect(isAlbumAlreadyInCatalog(candidate, catalog)).toBe(true);
    });

    test('allows non-duplicate albums from the same artist', () => {
      const candidate = {
        id: 'spotify-cand-3',
        name: 'In Rainbows',
        artists: ['Radiohead'],
      };
      expect(isAlbumAlreadyInCatalog(candidate, catalog)).toBe(false);
    });

    test('allows non-duplicate albums from different artists', () => {
      const candidate = {
        id: 'spotify-cand-4',
        name: 'Titanic Rising',
        artists: ['Weyes Blood'],
      };
      expect(isAlbumAlreadyInCatalog(candidate, catalog)).toBe(false);
    });
  });
});
