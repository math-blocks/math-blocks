import {UnreachableCaseError} from "./util";
import {EditorCursor} from "./editor";
import {Box, Glyph, Rule, getWidth, getHeight, getDepth, vsize, getCharBearingX, getCharWidth, hlistWidth, getCharHeight} from "./layout";

const DEBUG = false;

export const renderBox = (box: Box, cursor: EditorCursor, ctx: CanvasRenderingContext2D) => {
  if (DEBUG) {
    ctx.strokeStyle = "blue";
    ctx.strokeRect(0, -box.height, getWidth(box), vsize(box));
  }

  switch (box.kind) {
    case "hbox": {
      const availableSpace = box.width - hlistWidth(box.content);
      const parentId = cursor.path[cursor.path.length - 1];
      ctx.save();

      box.content.forEach(node => {
        if (parentId === box.id && cursor.next === node.id) {
          ctx.fillRect(-1, -64 * 0.85, 2, 64);
        }
        switch (node.type) {
          case "Box": {
            ctx.translate(0, node.shift);
            renderBox(node, cursor, ctx);
            ctx.translate(0, -node.shift);
            break;
          }
          case "Rule": {
            renderRule(node, ctx);
            break;
          }
          case "Glue": {
            // TODO: look at all Glue nodes in the box to determine each
            // of their sizes.
            ctx.translate(availableSpace / 2, 0);
            break;
          }
          case "Glyph": {
            renderGlyph(node, ctx);
            break;
          }
          case "Kern": break;
          default: throw new UnreachableCaseError(node);
        }
        ctx.translate(getWidth(node), 0);
        if (parentId === box.id && cursor.prev === node.id) {
          ctx.fillRect(-1, -64 * 0.85, 2, 64);
        }
      });
      ctx.restore();
      break;
    }
    case "vbox": {
      const availableSpace = box.width - hlistWidth(box.content);
      ctx.save();
      ctx.translate(0, -box.height)
      box.content.forEach(node => {
        switch (node.type) {
          case "Box": {
            ctx.translate(0, getHeight(node));
            renderBox(node, cursor, ctx);
            ctx.translate(0, getDepth(node));
            break;
          }
          case "Rule": {
            ctx.translate(0, getHeight(node));
            renderRule(node, ctx);
            ctx.translate(0, getDepth(node));
            break;
          }
          case "Glyph": {
            ctx.translate(0, getHeight(node));
            renderGlyph(node, ctx);
            ctx.translate(0, getDepth(node));
            break;
          }
          case "Kern": {
            ctx.translate(0, node.size);
            break;
          }
          case "Glue": {
            // TODO: look at all Glue nodes in the box to determine each
            // of their sizes.
            ctx.translate(0, availableSpace / 2);
            break;
          }
          default: throw new UnreachableCaseError(node);
        }
      });
      ctx.restore();
      break;
    }
  }
};

const renderRule = (rule: Rule, ctx: CanvasRenderingContext2D) => {
  ctx.fillRect(0, -rule.height, getWidth(rule), vsize(rule));
}

const renderGlyph = (glyph: Glyph, ctx: CanvasRenderingContext2D) => {
  ctx.font = `${glyph.size}px comic sans ms`;
  ctx.fillText(glyph.char, 0, 0);

  if (DEBUG) {
    ctx.strokeStyle = "blue";
    const x = getCharBearingX(glyph);
    const y = -getCharHeight(glyph);
    ctx.strokeRect(x, y, getCharWidth(glyph), vsize(glyph));
  }
}
