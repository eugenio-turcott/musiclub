export function DetailLoading({label='Abriendo ficha…'}) {
  return <main className="min-h-screen cyber-grid px-4 pt-28 sm:px-8 text-white" aria-busy="true" aria-label={label}>
    <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-[#101222] p-6 sm:p-9">
      <p role="status" className="mb-6 text-sm font-bold text-cyan-300">{label}</p>
      <div className="grid gap-8 md:grid-cols-[minmax(180px,340px)_1fr]" aria-hidden="true">
        <div className="aspect-square rounded-2xl bg-white/5 motion-safe:animate-pulse"/>
        <div className="space-y-5"><div className="h-5 w-28 rounded bg-pink-300/10"/><div className="h-10 w-4/5 rounded bg-white/10"/><div className="h-6 w-2/5 rounded bg-cyan-300/10"/><div className="h-40 rounded-2xl bg-white/5"/></div>
      </div>
    </div>
  </main>;
}
