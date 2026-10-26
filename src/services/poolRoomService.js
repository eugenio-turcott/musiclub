import { supabase } from './supabaseClient.js';

async function call(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

export const poolRoomService = {
  async list(userId) {
    const { data: rooms, error } = await supabase.from('pool_rooms').select('id,name,description,visibility,owner_id,created_at').order('created_at');
    if (error) throw new Error('No se pudieron cargar las salas. Inténtalo de nuevo en unos momentos.');
    let memberships = new Set();
    if (userId) {
      const result = await supabase.from('pool_room_members').select('room_id').eq('user_id', userId);
      if (result.error) throw new Error('No se pudo comprobar tu acceso a las salas');
      memberships = new Set((result.data || []).map(item => item.room_id));
    }
    if (!rooms?.length) return [];
    const { data: seasons, error: seasonsError } = await supabase.from('seasons')
      .select('id,room_id,name,appearance').eq('is_active', true).in('room_id', rooms.map(room => room.id));
    if (seasonsError) throw new Error('No se pudieron cargar los Pools de las salas');
    const ownerIds = [...new Set(rooms.map(room => room.owner_id).filter(Boolean))];
    const [entriesResult, ownersResult] = await Promise.all([
      seasons?.length ? supabase.from('public_pool_entries').select('season_id,album_id').eq('status','GANADOR').in('season_id',seasons.map(season=>season.id)) : {data:[]},
      ownerIds.length ? supabase.from('public_profiles').select('id,name').in('id',ownerIds) : {data:[]},
    ]);
    if (entriesResult.error || ownersResult.error) throw new Error('No se pudo completar la información de las salas');
    const albumIds = [...new Set((entriesResult.data || []).map(entry=>entry.album_id))];
    const releases = albumIds.length ? await supabase.from('albums').select('id,album_name,image_url').in('id',albumIds) : {data:[]};
    if (releases.error) throw new Error('No se pudieron cargar los discos elegidos');
    return rooms.map(room => {
      const season = (seasons || []).find(item=>item.room_id===room.id);
      const entry = (entriesResult.data || []).find(item=>item.season_id===season?.id);
      const winner = (releases.data || []).find(item=>item.id===entry?.album_id);
      const owner = (ownersResult.data || []).find(item=>item.id===room.owner_id);
      return { ...room, owner_name: owner?.name?.trim() || (room.owner_id ? 'Miembro de Musiclub' : 'Administración de Musiclub'),
        active_pool: season ? {...season,title:season.appearance?.heading?.trim() || season.name,winner:winner || null} : null,
        joined: memberships.has(room.id) || Boolean(userId && room.owner_id === userId) };
    });
  },
  create: ({ name, description, visibility }) => call('musiclub_create_pool_room', { p_name: name.trim(), p_description: description.trim(), p_visibility: visibility }),
  join: roomId => call('musiclub_join_pool_room', { p_room: roomId }),
  invite: (roomId, revoke = false) => call('musiclub_invite_pool_room', { p_room: roomId, p_revoke: revoke }),
  redeem: token => call('musiclub_redeem_pool_invite', { p_token: token }),
  leave: roomId => call('musiclub_leave_pool_room', { p_room: roomId }),
};

export function poolInviteToken(input) {
  const value = String(input || '').trim();
  let token = value;
  if (value.startsWith('https://') || value.startsWith('http://')) {
    try { token = new URL(value).searchParams.get('invitacion') || ''; } catch { return ''; }
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token) ? token : '';
}
