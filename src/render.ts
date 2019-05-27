import {UnreachableCaseError} from "./util";
import {Box, Glyph, Rule, width, height, depth, vsize, getCharBearingX, getCharWidth, hlistWidth, getCharHeight} from "./layout";

const DEBUG = true;

export const renderBox = (box: Box, ctx: CanvasRenderingContext2D) => {
  if (DEBUG) {
    ctx.strokeStyle = "blue";
    ctx.strokeRect(0, -box.height, width(box), vsize(box));
  }

  switch (box.kind) {
    case "hbox": {
      const availableSpace = box.width - hlistWidth(box.content);
      ctx.save();
      box.content.forEach(node => {
        switch (node.type) {
          case "Box": {
            ctx.translate(0, node.shift);
            renderBox(node, ctx);
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
        ctx.translate(width(node), 0);
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
            ctx.translate(0, height(node));
            renderBox(node, ctx);
            ctx.translate(0, depth(node));
            break;
          }
          case "Rule": {
            ctx.translate(0, height(node));
            renderRule(node, ctx);
            ctx.translate(0, depth(node));
            break;
          }
          case "Glyph": {
            ctx.translate(0, height(node));
            renderGlyph(node, ctx);
            ctx.translate(0, depth(node));
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
  ctx.fillRect(0, -rule.height, width(rule), vsize(rule));
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
