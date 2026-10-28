import icons from '../utils/interfaceIcons.cjs';
import artwork from '../utils/interfaceArtwork.cjs';

export function UiIcon({ name = 'music', className = '', size, tone = 'auto', ...props }) {
  const body = artwork.ICON_BODIES[name] || artwork.ICON_BODIES.music;
  const color = artwork.ICON_COLORS[name] || '#f472b6';
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-ui-icon={name} className={`ui-icon ${className}`} {...props} style={{'--ui-icon-accent':color, ...(size == null ? {} : {width:size,height:size}), ...(tone === 'inherit' ? {color:'inherit'} : tone === 'white' ? {color:'#fff'} : tone === 'accent' ? {color} : {}), ...props.style}}>
    {artwork.ICON_FILLS[name] && <g fill="currentColor" fillOpacity=".28" stroke="none" dangerouslySetInnerHTML={{__html:artwork.ICON_FILLS[name]}} />}
    <g opacity=".15" strokeWidth="4.5" dangerouslySetInnerHTML={{__html:body}} />
    <g dangerouslySetInnerHTML={{__html:body}} />
  </svg>;
}

// Only explicit interface labels use this helper; user-authored content stays intact.
export function InterfaceText({ children }) {
  const parsed = icons.iconParts(children);
  const parts = parsed?.reduce((items, part) => {
    const previous = items.at(-1);
    if (part.text != null && previous?.text != null) previous.text += part.text;
    else items.push({...part});
    return items;
  }, []);
  if (!parts?.some(part => part.icon)) return children;
  const content = parts.every(part => part.icon || !part.text.trim())
    ? parts.filter(part => part.icon).map((part, index) => <UiIcon key={index} name={part.icon} />)
    : <span className="interface-label">{parts.map((part, index) => part.icon ? <UiIcon key={index} name={part.icon} /> : part.text.trim() && <span key={index} className="interface-label-text">{part.text.trim()}</span>)}</span>;
  return <>{/^\s/.test(children) && ' '}{content}{/\s$/.test(children) && ' '}</>;
}
