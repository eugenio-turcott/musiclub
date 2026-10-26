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
    return (rooms || []).map(room => ({ ...room, joined: memberships.has(room.id) || Boolean(userId && room.owner_id === userId) }));
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
