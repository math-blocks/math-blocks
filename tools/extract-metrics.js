#!/usr/bin/env node
const opentype = require("opentype.js");

if (process.argv.length !== 3) {
    console.error("Usage: extract-metrics.js path/to/font.ttf");
    process.exit(1);
}

const filename = process.argv[2];

opentype.load(filename, (err, font) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    const {glyphs, unitsPerEm, ascender, descender, tables} = font;
    // extract some values from the postscript table
    const {underlinePosition, underlineThickness} = tables.post;

    const output = {
        unitsPerEm,
        ascender,
        descender,
        glyphMetrics: Object.values(glyphs.glyphs).reduce((accum, glyph) => {
            if (glyph.unicode === undefined) {
                return accum;
            }

            return {
                ...accum,
                [glyph.unicode]: {
                    advance: glyph.advanceWidth,
                    bearingX: glyph.xMin,
                    bearingY: glyph.yMax,
                    width: glyph.xMax - glyph.xMin,
                    height: glyph.yMax - glyph.yMin,
                },
            };
        }, {}),
    };

    console.log(JSON.stringify(output, null, 2));
});
