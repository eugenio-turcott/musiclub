// src/utils/recommendationEngine.test.js
import {
  buildUserTasteProfile,
  findTasteTwins,
  calculateAlbumCompatibility,
  getPersonalizedRecommendations,
  CRITERIA_DEFINITIONS,
} from './recommendationEngine';

describe('recommendationEngine', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Eugenio',
    email: 'eugenio@example.com',
    favorite_artist: 'Radiohead',
    favorite_album: 'In Rainbows',
    favorite_genres: ['Art Rock', 'Indie'],
  };

  const mockUserReviews = [
    {
      album_id: 'album-1',
      reviewer_name: 'Eugenio',
      reviewer_email: 'eugenio@example.com',
      rating_general: 10,
      rating_produccion: 5,
      rating_composicion: 5,
      rating_letras: 4,
      rating_originalidad: 5,
      rating_cohesion: 5,
      rating_replay: 5,
      track_ratings: { 't1': 10, 't2': 9.5 },
    },
    {
      album_id: 'album-2',
      reviewer_name: 'Eugenio',
      reviewer_email: 'eugenio@example.com',
      rating_general: 9,
      rating_produccion: 4.5,
      rating_composicion: 5,
      rating_letras: 4.5,
      rating_originalidad: 4,
      rating_cohesion: 4.5,
      rating_replay: 4,
      track_ratings: { 't1': 9, 't2': 8.5 },
    },
  ];

  const mockAllAlbums = [
    {
      id: 'album-1',
      album_name: 'OK Computer',
      artist_name: 'Radiohead',
      image_url: 'https://example.com/okc.jpg',
      status: 'GANADOR',
      final_rating: 9.6,
      review_count: 5,
      criteria_averages: {
        rating_produccion: 4.9,
        rating_composicion: 5.0,
        rating_letras: 4.8,
        rating_originalidad: 4.9,
        rating_cohesion: 4.9,
        rating_replay: 4.7,
      },
    },
    {
      id: 'album-2',
      album_name: 'Kid A',
      artist_name: 'Radiohead',
      image_url: 'https://example.com/kida.jpg',
      status: 'ACTIVO',
      final_rating: 9.2,
      review_count: 4,
      criteria_averages: {
        rating_produccion: 4.8,
        rating_composicion: 4.7,
        rating_letras: 4.0,
        rating_originalidad: 5.0,
        rating_cohesion: 4.8,
        rating_replay: 4.2,
      },
    },
    {
      id: 'album-3',
      album_name: 'Titanic Rising',
      artist_name: 'Weyes Blood',
      image_url: 'https://example.com/titanic.jpg',
      status: 'ACTIVO',
      final_rating: 9.4,
      review_count: 6,
      criteria_averages: {
        rating_produccion: 4.9,
        rating_composicion: 5.0,
        rating_letras: 4.7,
        rating_originalidad: 4.6,
        rating_cohesion: 4.8,
        rating_replay: 4.5,
      },
    },
    {
      id: 'album-4',
      album_name: 'A Moon Shaped Pool',
      artist_name: 'Radiohead',
      image_url: 'https://example.com/amsp.jpg',
      status: 'INDIVIDUAL',
      final_rating: 8.8,
      review_count: 3,
      criteria_averages: {
        rating_produccion: 4.8,
        rating_composicion: 4.9,
        rating_letras: 4.5,
        rating_originalidad: 4.3,
        rating_cohesion: 4.6,
        rating_replay: 4.0,
      },
    },
  ];

  const mockAllReviews = [
    ...mockUserReviews,
    {
      album_id: 'album-1',
      reviewer_name: 'Jesús',
      reviewer_email: 'jesus@example.com',
      rating_general: 10,
      rating_produccion: 5,
      rating_composicion: 5,
      rating_letras: 5,
      rating_originalidad: 5,
      rating_cohesion: 5,
      rating_replay: 5,
      track_ratings: { 't1': 10, 't2': 9.5 },
    },
    {
      album_id: 'album-2',
      reviewer_name: 'Jesús',
      reviewer_email: 'jesus@example.com',
      rating_general: 9,
      rating_produccion: 4.5,
      rating_composicion: 5,
      rating_letras: 4.5,
      rating_originalidad: 4,
      rating_cohesion: 4.5,
      rating_replay: 4,
      track_ratings: { 't1': 9, 't2': 8.5 },
    },
    {
      album_id: 'album-3',
      reviewer_name: 'Jesús',
      reviewer_email: 'jesus@example.com',
      rating_general: 9.8,
      rating_produccion: 5,
      rating_composicion: 5,
      rating_letras: 5,
      rating_originalidad: 4.8,
      rating_cohesion: 5,
      rating_replay: 5,
      track_ratings: { 't1': 10 },
    },
  ];

  const mockAllProfiles = [
    {
      id: 'user-1',
      name: 'Eugenio',
      email: 'eugenio@example.com',
    },
    {
      id: 'user-2',
      name: 'Jesús',
      email: 'jesus@example.com',
      avatar_url: 'https://example.com/jesus.jpg',
    },
  ];

  test('buildUserTasteProfile correctly identifies top criteria and archetype', () => {
    const profile = buildUserTasteProfile(mockUser, mockUserReviews, mockAllAlbums);

    expect(profile.hasHistory).toBe(true);
    expect(profile.totalReviews).toBe(2);
    expect(profile.topRatedAlbums.length).toBeGreaterThan(0);
    expect(profile.criteriaWeights.rating_composicion).toBeGreaterThan(0.8);
    expect(profile.tasteArchetype).toBeDefined();
    expect(profile.tasteArchetype.title).toBeTruthy();
  });

  test('findTasteTwins identifies users with similar rating habits', () => {
    const twins = findTasteTwins(mockUser, mockUserReviews, mockAllReviews, mockAllProfiles);

    expect(twins.length).toBeGreaterThan(0);
    expect(twins[0].name).toBe('Jesús');
    expect(twins[0].similarity).toBeGreaterThanOrEqual(80);
    expect(twins[0].commonAlbumsCount).toBe(2);
  });

  test('getPersonalizedRecommendations filters out reviewed albums and ranks candidates', () => {
    const result = getPersonalizedRecommendations(
      mockUser,
      mockUserReviews,
      mockAllAlbums,
      mockAllReviews,
      mockAllProfiles
    );

    expect(result.reviewedCount).toBe(2);
    expect(result.unreviewedCount).toBe(2); // album-3 and album-4

    // album-4 is by Radiohead (favorite/top artist), album-3 is highly rated by twin Jesús
    expect(result.recommendations.length).toBe(2);
    expect(result.recommendations[0].compatibilityScore).toBeGreaterThan(70);
    expect(result.recommendations[0].matchBadges.length).toBeGreaterThan(0);
    expect(result.recommendations[0].primaryReason).toBeTruthy();
  });
});
