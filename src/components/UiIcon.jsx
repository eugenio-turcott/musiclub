import icons from '../utils/interfaceIcons.cjs';
import artwork from '../utils/interfaceArtwork.cjs';

export function UiIcon({ name = 'music', className = '', ...props }) {
  const body = artwork.ICON_BODIES[name] || artwork.ICON_BODIES.music;
  const color = artwork.ICON_COLORS[name] || '#f472b6';
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-ui-icon={name} className={`ui-icon ${className}`} {...props} style={{color, ...props.style}}>
    {artwork.ICON_FILLS[name] && <g fill="currentColor" fillOpacity=".28" stroke="none" dangerouslySetInnerHTML={{__html:artwork.ICON_FILLS[name]}} />}
    <g opacity=".15" strokeWidth="4.5" dangerouslySetInnerHTML={{__html:body}} />
    <g dangerouslySetInnerHTML={{__html:body}} />
  </svg>;
}

// Only explicit interface labels use this helper; user-authored content stays intact.
export function InterfaceText({ children }) {
  const parts = icons.iconParts(children);
  if (!parts) return children;
  return parts.map((part, index) => part.icon ? <UiIcon key={index} name={part.icon} /> : part.text);
}
