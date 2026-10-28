import icons from './interfaceIcons.cjs';

// Use the same vector artwork in share-card previews and decorative canvases.
const paths = new Map();
export function drawInterfaceText(ctx, text, x, y) {
  const parts = icons.iconParts(String(text));
  const size = Number(ctx.font.match(/([\d.]+)px/)?.[1]) || 16;
  const width = parts.reduce((sum, part) => sum + (part.icon ? size : ctx.measureText(part.text).width), 0);
  let left = x - (ctx.textAlign === 'center' ? width / 2 : ['right', 'end'].includes(ctx.textAlign) ? width : 0);
  const top = y - (ctx.textBaseline === 'middle' ? size / 2 : ['top', 'hanging'].includes(ctx.textBaseline) ? 0 : size * .8);
  ctx.save();
  ctx.textAlign = 'left';
  for (const part of parts) {
    if (part.text !== undefined) {
      ctx.fillText(part.text, left, y);
      left += ctx.measureText(part.text).width;
    } else {
      if (!paths.has(part.icon)) paths.set(part.icon, new Path2D(icons.ICON_PATHS[part.icon]));
      ctx.save();
      ctx.translate(left, top); ctx.scale(size / 24, size / 24);
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.stroke(paths.get(part.icon)); ctx.restore(); left += size;
    }
  }
  ctx.restore();
}
