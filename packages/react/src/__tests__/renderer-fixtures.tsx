// Fixtures for the snapshot tests in renderer.test.tsx. Each one renders a
// MathRenderer with the font data the test loads.
import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';
import type { FontData } from '@math-blocks/opentype';
import { macros } from '@math-blocks/tex';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';

const { row, char: glyph, frac, limits, root, subsup, macro } = Editor.builders;
const { applyColorMapToEditorNode } = Editor.transforms;
const reducer = Editor.getReducer(macros);

type FixtureProps = { readonly fontData: FontData };

const style = { background: 'white' };

export const Equation: React.FC<FixtureProps> = ({ fontData }) => {
  // TODO: how to convert
  const math = row([
    glyph('2'),
    glyph('x'),
    glyph('+'),
    glyph('5'),
    glyph('='),
    glyph('1'),
    glyph('0'),
  ]);
  const fontSize = 60;
  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const Cursor: React.FC<FixtureProps> = ({ fontData }) => {
  const math = row([
    glyph('2'),
    glyph('x'),
    glyph('+'),
    glyph('5'),
    glyph('='),
    glyph('1'),
    glyph('0'),
  ]);
  const selection: Editor.Selection = {
    anchor: { path: [], offset: 1 },
    focus: { path: [], offset: 1 },
  };

  const fontSize = 60;
  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={math}
        selection={selection}
        style={style}
        fontSize={fontSize}
        showCursor={true}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const Selection: React.FC<FixtureProps> = ({ fontData }) => {
  const math = row([
    glyph('2'),
    glyph('x'),
    glyph('+'),
    glyph('5'),
    glyph('='),
    glyph('1'),
    glyph('0'),
  ]);
  const selection: Editor.Selection = {
    anchor: { path: [], offset: 1 },
    focus: { path: [], offset: 5 },
  };

  const fontSize = 60;
  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={math}
        selection={selection}
        style={style}
        fontSize={fontSize}
        showCursor={true}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const Pythagoras: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const pythagoras = row([
    glyph('a'),
    Editor.util.sup('2'),
    glyph('+'),
    glyph('b'),
    Editor.util.sup('2'),
    glyph('='),
    glyph('c'),
    Editor.util.sup('2'),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={pythagoras}
        style={style}
        fontSize={fontSize}
        showCursor={true}
      />
    </FontDataContext.Provider>
  );
};

export const QuadraticEquation: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const math = row([
    glyph('x'),
    glyph('='),
    frac(
      [
        glyph('\u2212'),
        glyph('b'),
        glyph('\u00B1'),
        root(null, [
          glyph('b'),
          Editor.util.sup('2'),
          glyph('\u2212'),
          glyph('4'),
          glyph('a'),
          glyph('c'),
        ]),
      ],
      [glyph('2'), glyph('a')],
    ),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const Limit: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const math = row([
    limits(row([glyph('l'), glyph('i'), glyph('m')]), [
      glyph('y'),
      glyph('\u2192'), // \rightarrow
      glyph('0'),
    ]),
    glyph('x'),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={math}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const InlineLimit: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const math = row([
    limits(row([glyph('l'), glyph('i'), glyph('m')]), [
      glyph('y'),
      glyph('\u2192'), // \rightarrow
      glyph('0'),
    ]),
    glyph('x'),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={math}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
        mathStyle={Typesetter.MathStyle.Text}
      />
    </FontDataContext.Provider>
  );
};

export const Summation: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const math = row([
    limits(
      glyph('\u03a3'),
      [glyph('i'), glyph('='), glyph('0')],
      [glyph('\u221e')],
    ),
    frac([glyph('1')], [glyph('2'), Editor.util.sup('i')]),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const InlineSummation: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const math = row([
    limits(
      glyph('\u03a3'),
      [glyph('i'), glyph('='), glyph('0')],
      [glyph('\u221e')],
    ),
    frac([glyph('1')], [glyph('2'), Editor.util.sup('i')]),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={math}
        style={style}
        fontSize={fontSize}
        mathStyle={Typesetter.MathStyle.Text}
      />
    </FontDataContext.Provider>
  );
};

export const Integral: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const math = row([
    limits(
      glyph('\u222B'), // \sum
      [glyph('0')],
      [glyph('1')], // \infty
    ),
    frac([glyph('1')], [glyph('x')]),
    glyph('d'),
    glyph('x'),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const InlineIntegral: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const math = row([
    limits(
      glyph('\u222B'), // \sum
      [glyph('0')],
      [glyph('1')], // \infty
    ),
    frac([glyph('1')], [glyph('x')]),
    glyph('d'),
    glyph('x'),
  ]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={math}
        style={style}
        fontSize={fontSize}
        mathStyle={Typesetter.MathStyle.Text}
      />
    </FontDataContext.Provider>
  );
};

export const ColorizedFraction: React.FC<FixtureProps> = ({ fontData }) => {
  const fontSize = 60;
  const colorMap = new Map<number, string>();
  const fracNode = frac([glyph('1')], [glyph('2'), Editor.util.sup('i')]);

  colorMap.set(fracNode.id, 'darkcyan');
  colorMap.set(fracNode.children[1].id, 'orange');
  const subsup = fracNode.children[1].children[1];
  if (subsup.type === 'subsup' && subsup.children[1]) {
    colorMap.set(subsup.children[1].id, 'pink');
  }

  const fracNodeWithColor = applyColorMapToEditorNode(fracNode, colorMap);
  const math = row([fracNodeWithColor]);

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const TallDelimiters: React.FC<FixtureProps> = ({ fontData }) => {
  const editNode = Editor.builders.row([
    Editor.builders.delimited(
      [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])],
      glyph('('),
      glyph(')'),
    ),
    glyph('+'),
    root(null, [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])]),
  ]);

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={editNode} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const TallDelimitersWithCursor: React.FC<FixtureProps> = ({
  fontData,
}) => {
  const math = Editor.builders.row([
    Editor.builders.delimited(
      [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])],
      glyph('('),
      glyph(')'),
    ),
    glyph('+'),
    root(null, [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])]),
  ]);

  let state: Editor.State = {
    row: math,
    selecting: false,
    selection: {
      anchor: { path: [], offset: 0 },
      focus: { path: [], offset: 0 },
    },
  };

  state = reducer(state, { type: 'ArrowRight' });
  state = reducer(state, { type: 'ArrowRight' });

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={state.row}
        selection={state.selection}
        style={style}
        fontSize={fontSize}
        showCursor={true}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const TallDelimitersWithSelection: React.FC<FixtureProps> = ({
  fontData,
}) => {
  const math = Editor.builders.row([
    Editor.builders.delimited(
      [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])],
      glyph('('),
      glyph(')'),
    ),
    glyph('+'),
    root(null, [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])]),
  ]);

  const state: Editor.State = {
    row: math,
    selecting: true,
    selection: {
      anchor: { path: [], offset: 0 },
      focus: { path: [], offset: 2 },
    },
  };

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={state.row}
        selection={state.selection}
        style={style}
        fontSize={fontSize}
        showCursor={true}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const RadicalWithDegreeDynamic: React.FC<FixtureProps> = ({
  fontData,
}) => {
  const editNode = Editor.builders.row([root([glyph('3')], [glyph('x')])]);

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={editNode}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const RadicalWithLargeDegreeDynamic: React.FC<FixtureProps> = ({
  fontData,
}) => {
  const editNode = Editor.builders.row([
    frac(
      [glyph('1')],
      [root([glyph('1'), glyph('2'), glyph('3')], [glyph('x')])],
    ),
  ]);

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={editNode}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const SubscriptSuperscriptStressTest: React.FC<FixtureProps> = ({
  fontData,
}) => {
  const editNode = Editor.builders.row([
    glyph('x'),
    subsup(
      [glyph('n'), subsup(undefined, [glyph('2')])],
      [glyph('n'), subsup([glyph('j')], undefined)],
    ),
    glyph('+'),
    glyph('x'),
    subsup(
      [glyph('n'), subsup([glyph('j')], undefined)],
      [glyph('n'), subsup(undefined, [glyph('2')])],
    ),
  ]);

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={editNode}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const ScriptsOnTallDelimiters: React.FC<FixtureProps> = ({
  fontData,
}) => {
  const editNode = Editor.builders.row([
    glyph('x'),
    glyph('+'),
    Editor.builders.delimited(
      [frac([glyph('y'), glyph('\u2212'), glyph('1')], [glyph('x')])],
      glyph('('),
      glyph(')'),
    ),
    subsup([glyph('n')], [glyph('2')]),
    glyph('+'),
    glyph('z'),
  ]);

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={editNode}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const Cancelling: React.FC<FixtureProps> = ({ fontData }) => {
  const editNode = Editor.builders.row([
    glyph('x'),
    glyph('y'),
    glyph('+'),
    Editor.builders.frac([glyph('a')], [glyph('b')]),
    glyph('\u2212'),
    Editor.builders.root(null, [glyph('z'), glyph('+'), glyph('1')]),
  ]);

  // @ts-expect-error: ignore readonly
  editNode.children[0].style.cancel = 1;
  // @ts-expect-error: ignore readonly
  editNode.children[1].style.cancel = 2;
  // @ts-expect-error: ignore readonly
  editNode.children[3].style.cancel = 3;
  // @ts-expect-error: we know that this is a root
  editNode.children[5].children[1].children[0].style.cancel = 4;
  // @ts-expect-error: we know that this is a root
  editNode.children[5].children[1].children[1].style.cancel = 4;
  // @ts-expect-error: we know that this is a root
  editNode.children[5].children[1].children[2].style.cancel = 4;

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={editNode}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const Matrix: React.FC<FixtureProps> = ({ fontData }) => {
  const matrix = Editor.builders.row([
    Editor.builders.char('A'),
    Editor.builders.char('='),
    Editor.builders.matrix(
      [
        // first row
        Editor.builders.row([Editor.builders.char('a')]),
        Editor.builders.row([Editor.builders.char('b')]),
        Editor.builders.row([Editor.builders.char('c')]),

        // second row
        Editor.builders.row([Editor.builders.char('d')]),
        Editor.builders.row([
          Editor.builders.char('e'),
          Editor.builders.char('+'),
          Editor.builders.char('1'),
        ]),
        Editor.builders.row([Editor.builders.char('f')]),

        // third row
        Editor.builders.row([Editor.builders.char('0')]),
        Editor.builders.row([Editor.builders.char('0')]),
        Editor.builders.row([Editor.builders.char('1')]),
      ],
      3,
      3,
      {
        left: Editor.builders.char('['),
        right: Editor.builders.char(']'),
      },
    ),
  ]);

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={matrix}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const InProgressMacro: React.FC<FixtureProps> = ({ fontData }) => {
  const math = Editor.builders.row([
    glyph('x'),
    glyph('+'),
    macro([glyph('p'), glyph('i')]),
    glyph('+'),
    glyph('y'),
  ]);

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={math}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};
