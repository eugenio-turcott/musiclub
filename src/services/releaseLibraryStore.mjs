import library from '../utils/releaseLibrary.cjs';

export function createReleaseLibraryStore(client) {
  let snapshot = { account: null, loading: true, rows: [], pending: [], error: '' };
  let generation = 0, readVersion = 0;
  const listeners = new Set();
  const emit = patch => { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); };
  async function refresh() {
    const account = snapshot.account, current = generation, read = ++readVersion;
    if (!account) return snapshot;
    if (snapshot.pending.length) throw new Error('Espera a que termine el guardado.');
    try {
      const rows = [];
      for (let from = 0; ; from += 500) {
        const result = await client.from('user_release_preferences').select('*').eq('user_id', account)
          .order('release_key').range(from, from + 499);
        if (result.error) throw new Error('No pudimos cargar tus listas. Inténtalo de nuevo.');
        rows.push(...(result.data || []));
        if ((result.data || []).length < 500) break;
      }
      if (current !== generation || read !== readVersion) throw new Error('La sesión o la lista cambiaron. Inténtalo de nuevo.');
      emit({ rows, loading: false, error: '' });
      return snapshot;
    } catch (error) {
      if (current === generation && read === readVersion) emit({ loading: false, error: error.message });
      throw error;
    }
  }
  async function setAccount(account) {
    generation++; readVersion++;
    emit({ account, rows: [], pending: [], loading: Boolean(account), error: '' });
    if (account) await refresh();
  }
  async function setPreference(album, action, value) {
    const account = snapshot.account, current = generation;
    if (!account) throw new Error('Inicia sesión para guardar tu lista.');
    if (snapshot.loading || snapshot.error) throw new Error('Primero carga tus listas e inténtalo de nuevo.');
    if (!['listen_later', 'gashapon_dismissed'].includes(action) || typeof value !== 'boolean') throw new Error('Acción no válida.');
    const release = library.releaseSnapshot(album), existing = library.findPreference(album, snapshot.rows);
    const key = existing?.release_key || library.releaseKey(release);
    if (existing) release.edition_member_ids = [...new Set([existing.release?.id, ...(existing.release?.edition_member_ids || []), ...release.edition_member_ids].filter(Boolean))].slice(0, 64);
    if (!release.album_name || !release.artist_name) throw new Error('Este release necesita título y artista.');
    if (snapshot.pending.includes(key)) return false;
    readVersion++;
    emit({ pending: [...snapshot.pending, key] });
    try {
      const { data, error } = await client.rpc('musiclub_set_release_preference', {
        p_release_key: key, p_release: release, p_action: action, p_value: value,
      }).single();
      if (error || !data || data.user_id !== account || data.release_key !== key || data[action] !== value) {
        throw new Error('No se pudo guardar el cambio. Tu lista sigue como estaba; vuelve a intentarlo.');
      }
      if (current !== generation) return false;
      emit({ rows: [data, ...snapshot.rows.filter(row => row.release_key !== key)] });
      return true;
    } finally {
      if (current === generation) emit({ pending: snapshot.pending.filter(item => item !== key) });
    }
  }
  return { getSnapshot: () => snapshot, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, setAccount, refresh, setPreference };
}
