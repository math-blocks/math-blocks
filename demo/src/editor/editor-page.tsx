import * as React from 'react';

import { MathEditor, MathKeypad, FontDataContext } from '@math-blocks/react';
import * as Editor from '@math-blocks/editor';
import { RadicalDegreeAlgorithm } from '@math-blocks/typesetter';

import { HStack, VStack } from '../shared/layout';
import { FONTS, useFont } from '../shared/fonts';

import FormattingPalette from '../shared/formatting-palette';
import { examples } from './examples';

const initialExample = 1;

const EditorPage: React.FunctionComponent = () => {
  const [fontIndex, setFontIndex] = React.useState<number>(0);
  // Only the selected font is loaded.
  const fontData = useFont(FONTS[fontIndex].folder);

  const [math, setMath] = React.useState<Editor.types.CharRow>(
    examples[initialExample],
  );

  const [radicalDegreeAlgorithm, setRadicalDegreeAlgorithm] =
    React.useState<RadicalDegreeAlgorithm>(RadicalDegreeAlgorithm.OpenType);

  const [showHitboxes, setShowHitboxes] = React.useState<boolean>(false);
  const [inline, setInline] = React.useState<boolean>(false);

  if (!fontData) {
    return null;
  }

  const fontSize = 64;

  // TODO:
  // - render glyphs using <path> and <text> side by side to compare their size
  // - fix radical and index positioning

  return (
    <FontDataContext.Provider value={fontData}>
      <HStack>
        <VStack>
          <FormattingPalette />
          {/* <EditingPanel /> */}
          <div style={{ height: 8 }} />
          <MathKeypad />
        </VStack>
        <VStack>
          <MathEditor
            fontSize={fontSize}
            readonly={false}
            row={math}
            radicalDegreeAlgorithm={radicalDegreeAlgorithm}
            showHitboxes={showHitboxes}
            inline={inline}
            style={{ marginTop: 8 }}
          />
          <br />
          <br />
          <VStack style={{ gap: 4 }}>
            <HStack>
              <span style={{ fontFamily: 'sans-serif', paddingRight: 8 }}>
                Example:{' '}
              </span>
              <select
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  setMath(examples[index]);
                }}
                defaultValue={initialExample}
              >
                <option value={0}>Simple Equation</option>
                <option value={1}>Quadratic Equation</option>
                <option value={2}>Adding Fractions</option>
                <option value={3}>All Node Types</option>
                <option value={4}>Tall Delimiters</option>
                <option value={5}>Nested Fractions</option>
                <option value={6}>Matrix</option>
                <option value={7}>Superscripts & Subscripts</option>
                <option value={8}>Integral</option>
                <option value={9}>Accents</option>
              </select>
            </HStack>
            <HStack>
              <span
                style={{
                  fontFamily: 'sans-serif',
                  paddingRight: 8,
                }}
              >
                Font:{' '}
              </span>
              <select
                onChange={(e) => setFontIndex(parseInt(e.target.value))}
                defaultValue={fontIndex}
              >
                {FONTS.map((font, index) => (
                  <option key={font.folder} value={index}>
                    {font.name}
                  </option>
                ))}
              </select>
            </HStack>
            <HStack>
              <span
                style={{
                  fontFamily: 'sans-serif',
                  paddingRight: 8,
                }}
              >
                Radical Degree Algorithm:{' '}
              </span>
              <select
                onChange={(e) =>
                  setRadicalDegreeAlgorithm(parseInt(e.target.value))
                }
                defaultValue={RadicalDegreeAlgorithm.OpenType}
              >
                <option value={RadicalDegreeAlgorithm.OpenType}>
                  OpenType
                </option>
                <option value={RadicalDegreeAlgorithm.MathML}>
                  MathML/Word
                </option>
              </select>
            </HStack>
            <HStack>
              <span
                style={{
                  fontFamily: 'sans-serif',
                  paddingRight: 8,
                }}
              >
                Show Hitboxes
              </span>
              <input
                type="checkbox"
                onChange={(e) => setShowHitboxes(e.target.checked)}
              ></input>
            </HStack>
            <HStack>
              <span
                style={{
                  fontFamily: 'sans-serif',
                  paddingRight: 8,
                }}
              >
                Inline
              </span>
              <input
                type="checkbox"
                checked={inline}
                onChange={(e) => setInline(e.target.checked)}
              ></input>
            </HStack>
          </VStack>
        </VStack>
      </HStack>
    </FontDataContext.Provider>
  );
};

export default EditorPage;
