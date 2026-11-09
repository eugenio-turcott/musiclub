import { UiIcon } from './UiIcon';

export function SearchSelectionNotice({ message, busy }) {
  if (!message) return null;
  return <div role={busy ? 'status' : 'alert'} className="mx-3 my-2 flex shrink-0 items-start gap-2 rounded-xl border border-amber-300/20 bg-slate-950/95 p-3 text-xs text-slate-200">
    <UiIcon name={busy ? 'cycle' : 'info'} size={20} className={busy ? 'motion-safe:animate-spin' : ''}/>
    <span>{message}</span>
  </div>;
}
