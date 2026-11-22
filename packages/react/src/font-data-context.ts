import * as React from 'react';

import type { FontData } from '@math-blocks/opentype';

// @ts-expect-error: we're missing the 'font' property
const placeholder: FontData = {
  fontFamily: '',
};

// TODO: switch the type to FontData | null
export const FontDataContext = React.createContext<FontData>(placeholder);

/**
 * Returns the font provided by FontDataContext, failing with a clear message
 * when no provider has supplied one.
 */
export const useFontData = (component: string): FontData => {
  const fontData = React.useContext(FontDataContext);
  if (!fontData.font) {
    throw new Error(
      `${component} needs a font: render it inside a FontDataContext.Provider`,
    );
  }
  return fontData;
};
