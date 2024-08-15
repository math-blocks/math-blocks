import * as React from 'react';

import { FontDataContext } from '@math-blocks/react';
import { getFontData, parse } from '@math-blocks/opentype';
import type { Font } from '@math-blocks/opentype';

import stix2 from '../../../assets/STIX2Math.otf';

import Tutor from './tutor';

const TutorPage: React.FunctionComponent = () => {
  const [font, setFont] = React.useState<Font | null>(null);

  React.useEffect(() => {
    const loadFont = async (): Promise<void> => {
      const res = await fetch(stix2);
      const blob = await res.blob();
      const font = await parse(blob);
      console.log(font);
      setFont(font);
    };

    loadFont();
  }, []);

  if (!font) {
    return null;
  }

  const fontData = getFontData(font, 'STIX2');

  return (
    <FontDataContext.Provider value={fontData}>
      <Tutor />
    </FontDataContext.Provider>
  );
};

export default TutorPage;
