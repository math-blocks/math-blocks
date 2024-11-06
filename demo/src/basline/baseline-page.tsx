import * as React from 'react';
import type { Blob } from 'buffer';

import { builders as b } from '@math-blocks/editor';
import { MathRenderer, FontDataContext } from '@math-blocks/react';
import { parse, getFontData } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import {
  RadicalDegreeAlgorithm,
  MathStyle,
  RenderMode,
} from '@math-blocks/typesetter';

import stix2 from '../../../assets/STIX2Math.otf';

const simpleRow = b.row([
  b.char('2'),
  b.char('x'),
  b.char('+'),
  b.frac(
    [b.char('t'), b.subsup([b.char('n'), b.char('-'), b.char('j')], undefined)],
    [b.char('b'), b.subsup(undefined, [b.char('2')]), b.char('+'), b.char('x')],
  ),
  b.char('='),
  b.char('1'),
  b.char('0'),
]);

const BaselinePage: React.FunctionComponent = () => {
  const [stixFontData, setStixFontData] = React.useState<FontData | null>(null);

  React.useEffect(() => {
    const loadFont = async (): Promise<void> => {
      const res = await fetch(stix2);
      const blob = await res.blob();
      const font = await parse(blob as Blob);
      setStixFontData(getFontData(font, 'STIX2'));
    };

    loadFont();
  }, []);

  if (!stixFontData) {
    return null;
  }

  const fontSize = 34;

  return (
    <FontDataContext.Provider value={stixFontData}>
      <div
        style={{ fontFamily: 'sans-serif', fontSize: 32, lineHeight: '48px' }}
      >
        <h1>Baseline Alignment Demo</h1>
        <p>Hello, world!</p>
        <p>
          Hello,{' '}
          <MathRenderer
            fontSize={fontSize}
            row={simpleRow}
            radicalDegreeAlgorithm={RadicalDegreeAlgorithm.OpenType}
            showHitboxes={false}
            mathStyle={MathStyle.Display}
            renderMode={RenderMode.Static}
          />{' '}
          world!
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation{' '}
          <MathRenderer
            fontSize={fontSize}
            row={simpleRow}
            radicalDegreeAlgorithm={RadicalDegreeAlgorithm.OpenType}
            showHitboxes={false}
            mathStyle={MathStyle.Display}
            renderMode={RenderMode.Static}
          />{' '}
          ullamco laboris nisi ut aliquip ex{' '}
          <MathRenderer
            fontSize={fontSize}
            row={simpleRow}
            radicalDegreeAlgorithm={RadicalDegreeAlgorithm.OpenType}
            showHitboxes={false}
            mathStyle={MathStyle.Display}
            renderMode={RenderMode.Static}
          />{' '}
          ea commodo consequat. Duis aute irure dolor in reprehenderit in
          voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident, sunt in culpa qui officia
          deserunt mollit anim id est laborum.
        </p>
      </div>
    </FontDataContext.Provider>
  );
};

export default BaselinePage;
