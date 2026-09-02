// scripts/test_fixes.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://nzsuxrycbywbdyidvsfl.supabase.co', 'sb_publishable_8CYM-sB7DY1_cyw8Amyr9g_-JtuZEKO');

async function testLeaderboard() {
  const [profilesRes, reviewsRes, albumsRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase
      .from('reviews')
      .select('*, albums(id, album_name, artist_name, image_url, release_type, release_year)'),
    supabase.from('albums').select('*'),
  ]);

  const profiles = profilesRes.data || [];
  const reviews = reviewsRes.data || [];
  const albums = albumsRes.data || [];

  console.log(`Profiles: ${profiles.length}, Reviews: ${reviews.length}, Albums: ${albums.length}`);

  const profileByEmail = new Map();
  const profileByName = new Map();
  profiles.forEach((p) => {
    if (p.email) profileByEmail.set(p.email.toLowerCase().trim(), p);
    if (p.name) profileByName.set(p.name.toLowerCase().trim(), p);
  });

  const userMap = new Map();

  profiles.forEach((p) => {
    const key = (p.email || p.name || p.id).toLowerCase().trim();
    userMap.set(key, {
      id: p.id,
      name: p.name || p.email?.split('@')[0] || 'Usuario',
      email: p.email || '',
      avatar_url: p.avatar_url || null,
      reviews: [],
    });
  });

  reviews.forEach((rev) => {
    const revEmail = (rev.reviewer_email || '').toLowerCase().trim();
    const revName = (rev.reviewer_name || '').toLowerCase().trim();

    let foundKey = null;
    if (revEmail && userMap.has(revEmail)) {
      foundKey = revEmail;
    } else if (revName && userMap.has(revName)) {
      foundKey = revName;
    } else {
      for (const [k, u] of userMap.entries()) {
        if (revEmail && u.email && u.email.toLowerCase().trim() === revEmail) {
          foundKey = k;
          break;
        }
        if (revName && u.name && u.name.toLowerCase().trim() === revName) {
          foundKey = k;
          break;
        }
      }
    }

    if (!foundKey) {
      const key = (rev.reviewer_email || rev.reviewer_name || rev.id).toLowerCase().trim();
      const prof =
        (revEmail && profileByEmail.get(revEmail)) ||
        (revName && profileByName.get(revName)) ||
        null;
      userMap.set(key, {
        id: prof?.id || key,
        name: rev.reviewer_name || prof?.name || 'Miembro',
        email: rev.reviewer_email || prof?.email || '',
        avatar_url: prof?.avatar_url || null,
        reviews: [],
      });
      foundKey = key;
    }

    userMap.get(foundKey).reviews.push(rev);
  });

  const leaders = Array.from(userMap.values())
    .map((u) => ({
      name: u.name,
      email: u.email,
      review_count: u.reviews.length,
    }))
    .sort((a, b) => b.review_count - a.review_count);

  console.log('Top 10 Leaderboard:', leaders.slice(0, 10));
}

testLeaderboard();
