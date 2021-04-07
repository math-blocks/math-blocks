import type {Glyph, GlyphMetrics} from "./types";

export const getGlyphMetrics = (glyph: Glyph): GlyphMetrics => {
    const commands = glyph.path;
    const xCoords = [];
    const yCoords = [];
    for (let i = 0; i < commands.length; i += 1) {
        const cmd = commands[i];
        if (cmd.type !== "Z") {
            xCoords.push(cmd.x);
            yCoords.push(cmd.y);
        }

        if (cmd.type === "Q" || cmd.type === "C") {
            xCoords.push(cmd.x1);
            yCoords.push(cmd.y1);
        }

        if (cmd.type === "C") {
            xCoords.push(cmd.x2);
            yCoords.push(cmd.y2);
        }
    }

    let xMin = Math.min(...xCoords);
    let yMin = Math.min(...yCoords);
    let xMax = Math.max(...xCoords);
    let yMax = Math.max(...yCoords);

    xMin = isFinite(xMin) ? xMin : 0;
    yMin = isFinite(yMin) ? yMin : 0;
    xMax = isFinite(xMax) ? xMax : glyph.metrics.advance;
    yMax = isFinite(yMax) ? yMax : 0;

    const glyphMetrics: GlyphMetrics = {
        advance: glyph.metrics.advance,
        bearingX: xMin,
        bearingY: yMax, // invert the y-axis
        width: xMax - xMin,
        height: yMax - yMin,
    };

    return glyphMetrics;
};
