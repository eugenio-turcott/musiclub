'use client';
export function QuickReviewForm({ score, onScore, comment, onComment, onSubmit, user, busy, error, success }) {
  return <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-pink-400/30 bg-black/30 p-4 sm:p-6">
    <h3 className="text-xl font-bold text-white">¿Qué te pareció este disco?</h3>
    <p className="text-sm text-slate-300">Una nota sobre 10 y un comentario opcional. Tu valoración cuenta tal como la elijas; no añadimos notas a los pilares ni a las canciones.</p>
    <fieldset><legend className="mb-2 text-sm font-semibold text-white">Tu calificación</legend>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <button key={n} type="button" aria-pressed={score === n} onClick={() => onScore(n)} className={`min-h-11 rounded-lg border font-bold ${score === n ? 'bg-pink-500 text-white border-pink-300' : 'bg-white/5 text-white border-white/20 hover:bg-white/15'}`}>{n}</button>)}</div>
    </fieldset>
    <label className="block text-sm text-white">Comentario opcional<textarea maxLength={4000} value={comment} onChange={e => onComment(e.target.value)} className="mt-2 block w-full rounded-xl bg-black/50 border border-white/20 p-3 text-white" rows={3} placeholder="¿Qué te gustó o qué cambiarías?" /></label>
    {!user && <p className="text-xs text-slate-300">Tu borrador se guarda en este navegador. Inicia sesión al publicar para asociarlo a tu perfil.</p>}
    {error && <p role="alert" className="text-rose-200">{error}</p>}
    {success && <p role="status" className="text-emerald-200">Tu valoración quedó publicada.</p>}
    <button disabled={busy || !score} className="min-h-11 w-full rounded-xl bg-pink-600 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Guardando…' : user ? 'Publicar valoración' : 'Continuar con Google'}</button>
  </form>;
}
