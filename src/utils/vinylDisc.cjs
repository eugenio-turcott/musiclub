function vinylDiscSvg(edition) {
  const {base, accent, highlight, pattern} = edition;
  let ink = '';
  if (pattern === 'split') ink = `<path d="M160 10a144 144 0 0 1 0 288Z" fill="${accent}"/><path d="M160 10v288" stroke="${highlight}" stroke-width="6" opacity=".45"/>`;
  if (pattern === 'swirl' || pattern === 'marble') ink = Array.from({length:pattern === 'marble' ? 9 : 5}, (_,i) => `<path d="M${-80+i*48} -25C${380-i*35} 45 ${-160+i*42} 220 ${390-i*17} 350" fill="none" stroke="${i%2 ? highlight : accent}" stroke-width="${pattern === 'marble' ? 12+i%3*9 : 29}" opacity="${i%2 ? '.5' : '.8'}"/>`).join('');
  if (pattern === 'splatter') ink = Array.from({length:38}, (_,i) => {
    const angle=i*2.39996, radius=83+(i*19%59), x=160+Math.cos(angle)*radius, y=160+Math.sin(angle)*radius;
    return `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="${2+i%5}" ry="${4+i%11}" fill="${i%3 ? accent : highlight}" transform="rotate(${i*137.5} ${x.toFixed(2)} ${y.toFixed(2)})" opacity=".86"/>`;
  }).join('');
  if (pattern === 'clear') ink = `<circle cx="160" cy="160" r="137" fill="none" stroke="${highlight}" stroke-width="5" opacity=".45"/><path d="M53 70Q130 1 237 51M30 157Q20 220 83 267" stroke="${highlight}" stroke-width="12" fill="none" opacity=".32"/>`;
  const grooves = Array.from({length:13}, (_,i) => `<circle cx="160" cy="160" r="${83+i*4.6}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><defs><clipPath id="record"><circle cx="160" cy="160" r="144"/></clipPath><linearGradient id="wax" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${highlight}"/><stop offset=".28" stop-color="${base}"/><stop offset="1" stop-color="${accent}"/></linearGradient><linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".42"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset=".82" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><circle cx="160" cy="160" r="144" fill="url(#wax)" opacity="${pattern === 'clear' ? '.78' : '1'}"/><g clip-path="url(#record)">${ink}</g><g fill="none" stroke="#11152b" stroke-width=".9" opacity=".21">${grooves}</g><circle cx="160" cy="160" r="144" fill="url(#sheen)"/><circle cx="160" cy="160" r="144" fill="none" stroke="${highlight}" stroke-width="2" opacity=".65"/><circle cx="160" cy="160" r="78" fill="#171433"/></svg>\n`;
}
module.exports = { vinylDiscSvg };
