import * as React from "react";

import type {FontData} from "./types";

const placeholder: FontData = {
    fontMetrics: {
        unitsPerEm: 1000,
        ascender: 850,
        descender: 150,
        getGlyphMetrics: (charCode: number) => null,
    },
    fontFamily: "",
};

export const FontDataContext = React.createContext<FontData>(placeholder);
