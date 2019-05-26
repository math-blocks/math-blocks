import {UnreachableCaseError} from "./util";
import {LayoutNode, width, getCharBearingX} from "./layout";

type Point = {
    x: number,
    y: number,
};

const typeset = (layout: LayoutNode, ctx: CanvasRenderingContext2D) => {
    const pen: Point = {x: 0, y: 0};

    switch (layout.type) {
        case "Box": {
            switch (layout.kind) {
                case "hbox": {
                    ctx.save();
                    layout.content.forEach(node => {
                        typeset(node, ctx);
                        ctx.translate(width(node), 0);
                    });
                    ctx.restore();
                    break;
                }
                case "vbox": {

                    break;
                }
            }
            break;
        }
        case "Glyph": {
            ctx.font = `${layout.size}px comic sans ms`;
            ctx.fillText(layout.char, getCharBearingX(layout), 0);
            break;
        }
        case "Kern": {
            
            break;
        }
        case "Rule": {

            break;
        }
        default: throw new UnreachableCaseError(layout);
    }
};

export default typeset;
