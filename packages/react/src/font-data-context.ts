import * as React from "react";

import type {FontData} from "@math-blocks/opentype";

// @ts-expect-error: we're missing the 'font' property
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

// TODO: switch the type to FontData | null
export const FontDataContext = React.createContext<FontData>(placeholder);
