import * as React from 'react';
import ReactJson from 'react-json-view';

import { SimpleMathEditor, FontDataContext } from '@math-blocks/react';
import { parse as parseFont, getFontData } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { builders, parse } from '@math-blocks/editor';
import type { SimpleState } from '@math-blocks/editor';
import type { types } from '@math-blocks/semantic';

import stix2 from '../../../assets/STIX2Math.otf';

import { HStack, VStack } from '../layout';

const simpleRow = builders.row([
  builders.char('2'),
  builders.char('x'),
  builders.char('+'),
  builders.char('5'),
  builders.char('='),
  builders.char('1'),
  builders.char('0'),
]);

const EditorPage: React.FunctionComponent = () => {
  const [stixFontData, setStixFontData] = React.useState<FontData | null>(null);
  const [editTree, setEditTree] = React.useState<SimpleState['row']>(simpleRow);
  const [ast, setAst] = React.useState<types.Node>(() => parse(simpleRow));
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    return query.matches;
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadFont = async (): Promise<void> => {
      const res = await fetch(stix2);
      const blob = await res.blob();
      const font = await parseFont(blob);
      setStixFontData(getFontData(font, 'STIX2'));
    };

    loadFont();
  }, []);

  React.useEffect(() => {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (query) => {
        setDarkMode(query.matches);
      });
  });

  if (!stixFontData) {
    return null;
  }

  const fontData = stixFontData;
  const fontSize = 64;

  const handleChange = (state: SimpleState) => {
    try {
      setEditTree(state.row);
      setAst(parse(state.row));
      setError(null);
    } catch (e) {
      const { message } = e as Error;
      setError(message);
      console.log(message);
    }
  };

  return (
    <FontDataContext.Provider value={fontData}>
      <VStack>
        <VStack
          style={{
            position: 'sticky',
            top: 0,
            marginTop: -8,
            paddingTop: 8,
            backgroundColor: 'var(--bg-color)',
          }}
        >
          <SimpleMathEditor
            fontSize={fontSize}
            readonly={false}
            row={simpleRow}
            onChange={handleChange}
            style={{ marginBottom: 8 }}
          />
          {error && (
            <VStack style={{ color: 'red', fontSize: 18 }}>{error}</VStack>
          )}
          <HStack style={{ justifyContent: 'space-between' }}>
            <VStack style={{ flex: 1, fontSize: 18, fontWeight: 'bold' }}>
              Editor Tree
            </VStack>
            <VStack style={{ flex: 1, fontSize: 18, fontWeight: 'bold' }}>
              Parse Tree
            </VStack>
          </HStack>
        </VStack>
        <HStack>
          <ReactJson
            src={editTree}
            theme={darkMode ? 'monokai' : 'rjv-default'}
            style={{ flex: 1 }}
            enableClipboard={false}
          />
          <ReactJson
            src={ast}
            theme={darkMode ? 'monokai' : 'rjv-default'}
            style={{ flex: 1 }}
            shouldCollapse={(field) => field.name === 'loc'}
            enableClipboard={false}
          />
        </HStack>
      </VStack>
    </FontDataContext.Provider>
  );
};

export default EditorPage;
