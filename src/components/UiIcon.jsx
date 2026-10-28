import icons from '../utils/interfaceIcons.cjs';

export function UiIcon({ name = 'music', className = '', ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`ui-icon ${className}`} {...props}><path d={icons.ICON_PATHS[name] || icons.ICON_PATHS.music} /></svg>;
}

// Only explicit interface labels use this helper; user-authored content stays intact.
export function InterfaceText({ children }) {
  const parts = icons.iconParts(children);
  if (!parts) return children;
  return parts.map((part, index) => part.icon ? <UiIcon key={index} name={part.icon} /> : part.text);
}
