import * as React from "react";

import type {FontMetrics} from "./types";

const placeholderMetrics: FontMetrics = {
    unitsPerEm: 1000,
    ascender: 850,
    descender: 150,
    getGlyphMetrics: (charCode: number) => null,
};

export const FontMetricsContext = React.createContext<FontMetrics>(
    placeholderMetrics,
);
