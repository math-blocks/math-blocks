import * as React from "react";

import type {FontData} from "@math-blocks/opentype";

// @ts-expect-error: we're missing the 'font' property
const placeholder: FontData = {
    fontFamily: "",
};

// TODO: switch the type to FontData | null
export const FontDataContext = React.createContext<FontData>(placeholder);
