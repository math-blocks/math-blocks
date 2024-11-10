import * as React from 'react';
import ReactJson from 'react-json-view';
import cx from 'classnames';
import type { Blob } from 'buffer';

import { MathEditor, MathKeypad, FontDataContext } from '@math-blocks/react';
import { parse as parseFont, getFontData } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { builders, parse } from '@math-blocks/editor';
import type { State } from '@math-blocks/editor';
import type { types } from '@math-blocks/semantic';

import stix2 from '../../../assets/STIX2Math.otf';

import { HStack, VStack } from '../shared/layout';
import FormattingPalette from '../shared/formatting-palette';
import styles from './parser-page.module.css';

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
  const [tab, setTab] = React.useState<'parse' | 'edit'>('parse');
  const [stixFontData, setStixFontData] = React.useState<FontData | null>(null);
  const [editTree, setEditTree] = React.useState<State['row']>(simpleRow);
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
      const font = await parseFont(blob as Blob);
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

  const handleChange = (state: State) => {
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
      <HStack style={{ height: '100vh' }}>
        <VStack>
          <FormattingPalette />
          <MathKeypad />
        </VStack>
        <VStack style={{ flex: 1 }}>
          <MathEditor
            fontSize={fontSize}
            readonly={false}
            row={simpleRow}
            onChange={handleChange}
            className={styles.input}
          />
          <HStack>
            <div
              className={cx({
                [styles.tabButton]: true,
                [styles.selected]: tab === 'parse',
              })}
              onClick={() => setTab('parse')}
            >
              Parse Tree
            </div>
            <div
              className={cx({
                [styles.tabButton]: true,
                [styles.selected]: tab === 'edit',
              })}
              onClick={() => setTab('edit')}
            >
              Edit Tree
            </div>
          </HStack>
          {tab === 'edit' ? (
            <ReactJson
              src={editTree}
              theme={darkMode ? 'monokai' : 'rjv-default'}
              style={{ overflow: 'scroll' }}
              shouldCollapse={(field) => field.name === 'loc'}
              enableClipboard={false}
            />
          ) : error ? (
            <div style={{ color: 'red', fontSize: 18 }}>{error}</div>
          ) : (
            <ReactJson
              src={ast}
              theme={darkMode ? 'monokai' : 'rjv-default'}
              style={{ overflow: 'scroll' }}
              shouldCollapse={(field) => field.name === 'loc'}
              enableClipboard={false}
            />
          )}
        </VStack>
      </HStack>
    </FontDataContext.Provider>
  );
};

export default EditorPage;
