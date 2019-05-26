import {UnreachableCaseError} from "./util";
import {LayoutNode, width, vsize, getCharBearingX, getCharHeight} from "./layout";

const render = (layout: LayoutNode, ctx: CanvasRenderingContext2D) => {
    switch (layout.type) {
        case "Box": {
            switch (layout.kind) {
                case "hbox": {
                    ctx.save();
                    layout.content.forEach(node => {
                        render(node, ctx);
                        ctx.translate(width(node), 0);
                    });
                    ctx.restore();
                    break;
                }
                case "vbox": {
                    ctx.save();
                    layout.content.forEach(node => {
                        render(node, ctx);
                        const size = vsize(node);
                        console.log(`size = ${size}`);
                        ctx.translate(0, size);
                    });
                    ctx.restore();
                    break;
                }
            }
            break;
        }
        case "Glue": {

            break;
        }
        case "Glyph": {
            ctx.font = `${layout.size}px comic sans ms`;
            // console.log(getCharHeight(layout));
            ctx.fillText(layout.char, getCharBearingX(layout), -getCharHeight(layout));
            break;
        }
        case "Kern": {

            break;
        }
        case "Rule": {
            ctx.fillRect(0, -layout.height, width(layout), vsize(layout));
            break;
        }
        default: throw new UnreachableCaseError(layout);
    }
};

export default render;
