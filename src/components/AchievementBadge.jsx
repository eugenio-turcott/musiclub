import { UiIcon } from './UiIcon';
import icons from '../utils/interfaceIcons.cjs';
import { TIER_STYLES } from '../utils/badgeSystem';
import {badgeIcon,badgeText} from '../utils/badgeIcons.mjs';

// One badge presentation for the guide, ranking and both profile views.
export function AchievementBadge({ badge, compact = false }) {
  const parts = icons.iconParts(badge.label || badge.name || badge.title || '') || [];
  const label = parts.filter(part => part.text).map(part => part.text).join('').trim();
  const icon = badgeIcon(badge);
  const tier = TIER_STYLES[`tier_${badge.tierNumber || badge.tier}`] ||
    Object.values(TIER_STYLES).find(style => style.tierRoman === badge.tierRoman);
  const record = badge.isRecord || badge.type === 'record';
  const rank = badge.type==='event'?'Grammy 2027 · Oro':tier ? `${tier.tierRoman} · ${tier.tierName}` : record ? 'Récord #1' : '';
  const palette = badge.color || badge.badgeClass || 'from-purple-600 to-indigo-600 text-white';
  const iconInk = /(?:^|\s)text-(?:black|[a-z]+-9(?:00|50))(?:\s|$)/.test(palette) ? '#000000' : '#ffffff';
  return <span data-achievement-badge={badge.id || label} data-badge-tier={tier?.tierRoman} data-event-edition={badge.type==='event'?'gold':undefined}
    aria-label={`${label}${rank ? ` — ${rank}` : ''}`}
    title={badgeText(badge.tooltip || badge.desc || `${label}${rank ? ` — ${rank}` : ''}`)}
    className={`achievement-badge ${compact ? 'achievement-badge-compact' : ''} bg-linear-to-r ${palette}`}>
    <span className="achievement-badge-emblem" data-badge-icon={icon} style={{color:iconInk}}><UiIcon name={icon} tone="inherit"/></span>
    <span className="achievement-badge-copy"><span>{label}</span>{rank && <small>{rank}</small>}</span>
  </span>;
}
