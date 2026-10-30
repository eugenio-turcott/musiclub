import { UiIcon } from './UiIcon';
import icons from '../utils/interfaceIcons.cjs';
import { TIER_STYLES } from '../utils/badgeSystem';

// One badge presentation for the guide, ranking and both profile views.
export function AchievementBadge({ badge, compact = false }) {
  const parts = icons.iconParts(badge.label || badge.name || badge.title || '') || [];
  const label = parts.filter(part => part.text).map(part => part.text).join('').trim();
  const icon = parts.find(part => part.icon)?.icon || 'award';
  const tier = TIER_STYLES[`tier_${badge.tierNumber || badge.tier}`] ||
    Object.values(TIER_STYLES).find(style => style.tierRoman === badge.tierRoman);
  const record = badge.isRecord || badge.type === 'record';
  const rank = tier ? `${tier.tierRoman} · ${tier.tierName}` : record ? 'Récord #1' : '';
  return <span data-achievement-badge={badge.id || label} data-badge-tier={tier?.tierRoman}
    aria-label={`${label}${rank ? ` — ${rank}` : ''}`}
    title={badge.tooltip || badge.desc || `${label}${rank ? ` — ${rank}` : ''}`}
    className={`achievement-badge ${compact ? 'achievement-badge-compact' : ''} bg-linear-to-r ${badge.color || badge.badgeClass || 'from-purple-600 to-indigo-600 text-white'}`}>
    <span className={`achievement-badge-emblem bg-linear-to-br ${tier?.badgeClass || 'from-white/20 to-white/5'}`}><UiIcon name={icon} tone="inherit"/></span>
    <span className="achievement-badge-copy"><span>{label}</span>{rank && <small>{rank}</small>}</span>
  </span>;
}
