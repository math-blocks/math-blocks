import * as React from "react";

import type {FontData} from "@math-blocks/opentype";

const placeholder: FontData = {
    fontMetrics: {
        unitsPerEm: 1000,
        ascender: 850,
        descender: 150,
        getGlyphMetrics: (codePoint: number | undefined) => null,
        hasChar: (char: string) => false,
    },
    fontFamily: "",
};

export const FontDataContext = React.createContext<FontData>(placeholder);
