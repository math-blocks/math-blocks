import React from 'react';
import { action } from '@storybook/addon-actions';
import type { Story } from '@storybook/react';
import { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';

import SimpleMathEditor from '../simple-math-editor';
import { FontDataContext } from '../font-data-context';

// @ts-expect-error: TypeScript doesn't know about this path
import fontPath from '../../../../assets/STIX2Math.otf';

const { builders } = Editor;
const { row, char: glyph } = builders;

const fontLoader = async (): Promise<FontData> => {
  const res = await fetch(fontPath);
  const blob = await res.blob();
  const font = await parse(blob as Blob);
  return getFontData(font, 'STIX2');
};

export default {
  title: 'SimpleMathEditor',
  component: SimpleMathEditor,
  loaders: [fontLoader],
};

type EmptyProps = Record<string, never>;

export const Editable: Story<EmptyProps> = (args, { loaded: fontData }) => {
  // TODO: write a function to convert a Semantic AST into an Editor AST
  const math = row([
    glyph('2'),
    glyph('x'),
    glyph('+'),
    glyph('5'),
    glyph('='),
    glyph('1'),
    glyph('0'),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <SimpleMathEditor
        readonly={false}
        row={math}
        onChange={action('onChange')}
        onSubmit={action('onSubmit')}
      />
    </FontDataContext.Provider>
  );
};

export const AllNodes: Story<EmptyProps> = (args, { loaded: fontData }) => {
  // TODO: write a function to convert a Semantic AST into an Editor AST
  const addingFractions = builders.row([
    builders.char('2'),
    builders.char('+'),
    builders.frac([builders.char('a')], [builders.char('b')]),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <SimpleMathEditor
        readonly={false}
        row={addingFractions}
        onChange={action('onChange')}
        onSubmit={action('onSubmit')}
      />
    </FontDataContext.Provider>
  );
};

export const Readonly: Story<EmptyProps> = (args, { loaded: fontData }) => {
  const math = row([
    glyph('2'),
    glyph('x'),
    glyph('+'),
    glyph('5'),
    glyph('='),
    glyph('1'),
    glyph('0'),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <SimpleMathEditor readonly={true} row={math} />
    </FontDataContext.Provider>
  );
};
