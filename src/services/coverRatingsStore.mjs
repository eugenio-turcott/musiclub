import identity from '../utils/coverRatingIdentity.cjs';

export function createCoverRatingsStore(db) {
  async function sessionUser() {
    const { data, error } = await db.auth.getUser();
    if (error || !data?.user?.id) throw new Error('Inicia sesión para gestionar tus calificaciones.');
    return data.user;
  }

  return {
    async getAll() {
      const { data, error } = await db.from('public_cover_ratings').select('*').order('created_at', { ascending: false });
      if (error) throw new Error('No pudimos cargar las calificaciones de portadas.');
      return data || [];
    },

    async getOwn(user) {
      if (!user?.id) return [];
      const queries = [db.from('cover_ratings').select('*').eq('user_id', user.id)];
      if (user.email) {
        // Compatibility for legacy rows without an owner ID; the private table remains protected by RLS.
        const email = identity.normalizedEmail(user.email).replace(/[\\%_]/g, '\\$&');
        queries.push(db.from('cover_ratings').select('*').is('user_id', null).ilike('user_email', email));
      }
      const results = await Promise.all(queries);
      if (results.some(result => result.error)) throw new Error('No pudimos cargar tus calificaciones de portadas.');
      return results.flatMap(result => result.data || []).filter(row => identity.ownsCoverRating(row, user));
    },

    async submit({ album_id, rating, aesthetic_tags = [], comment = '', user_name, user_avatar, user_id }) {
      const score = Number(rating);
      if (!album_id || !Number.isFinite(score) || score < 1 || score > 10) throw new Error('La calificación debe estar entre 1 y 10.');
      const user = await sessionUser();
      if (user_id && user_id !== user.id) throw new Error('Tu sesión cambió. Revisa tu cuenta antes de calificar.');
      if (!user.email) throw new Error('Tu cuenta necesita un correo verificado para calificar.');
      const payload = {
        album_id, rating: Math.round(score * 10) / 10,
        aesthetic_tags: Array.isArray(aesthetic_tags) ? aesthetic_tags.slice(0, 4) : [],
        comment: comment.trim() || null,
        user_id: user.id, user_email: identity.normalizedEmail(user.email),
        user_name: user_name?.trim() || null, user_avatar: user_avatar || null,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await db.from('cover_ratings').upsert(payload, { onConflict: 'album_id,user_email' }).select().single();
      if (error || !data) throw new Error('No se guardó tu calificación. Revisa tu conexión e inténtalo de nuevo.');
      return data;
    },

    async remove(id, albumId) {
      if (!id || !albumId) throw new Error('No se encontró una calificación guardada para eliminar.');
      const user = await sessionUser();
      // Resolve the exact owned row first, including historical rows without user_id.
      const { data: existing, error: readError } = await db.from('cover_ratings').select('id,album_id,user_id,user_email').eq('id', id).eq('album_id', albumId).maybeSingle();
      if (readError || !identity.ownsCoverRating(existing, user)) throw new Error('No puedes eliminar esta calificación.');
      let query = db.from('cover_ratings').delete().eq('id', id).eq('album_id', albumId);
      query = existing.user_id ? query.eq('user_id', user.id) : query.is('user_id', null).eq('user_email', existing.user_email);
      const { data, error } = await query.select('id');
      if (error || !data?.some(row => row.id === id)) throw new Error('No se eliminó tu calificación. Inténtalo de nuevo.');
      return true;
    },
  };
}
