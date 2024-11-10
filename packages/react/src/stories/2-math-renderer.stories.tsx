import * as React from 'react';
import type { Story } from '@storybook/react';
import type { Mutable } from 'utility-types';
import { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';
import * as Typesetter from '@math-blocks/typesetter';
import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';

// @ts-expect-error: TypeScript doesn't know about this path
import stixPath from '../../../../assets/STIX2Math.otf';

// @ts-expect-error: TypeScript doesn't know about this path
import lmPath from '../../../../assets/latinmodern-math.otf';

const { row, char: glyph, frac, limits, root, subsup, macro } = Editor.builders;
const { applyColorMapToEditorNode } = Editor.transforms;

const stixFontLoader = async (): Promise<FontData> => {
  const res = await fetch(stixPath);
  const blob = await res.blob();
  const font = await parse(blob as Blob);
  return getFontData(font, 'STIX2');
};

const lmFontLoader = async (): Promise<FontData> => {
  const res = await fetch(lmPath);
  const blob = await res.blob();
  const font = await parse(blob as Blob);
  return getFontData(font, 'LM-Math');
};

export default {
  title: 'MathRenderer',
  component: MathRenderer,
  loaders: [stixFontLoader],
};

type EmptyProps = Record<string, never>;

const style = { background: 'white' };

export const Small: Story<EmptyProps> = (args, { loaded: fontData }) => {
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
  const fontSize = 20;
  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const Equation: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const LatinModernEquation: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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
// @ts-expect-error: Story doesn't include 'loaders' static
LatinModernEquation.loaders = [lmFontLoader];

export const LatinModernRootAndFraction: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
  const math = row([
    root(null, [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])]),
  ]);
  const fontSize = 60;
  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};
// @ts-expect-error: Story doesn't include 'loaders' static
LatinModernRootAndFraction.loaders = [lmFontLoader];

export const Cursor: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const Selection: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const Pythagoras: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const QuadraticEquation: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const Limit: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const InlineLimit: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const Summation: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const InlineSummation: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const Integral: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const InlineIntegral: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const ColorizedFraction: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const ColorizedSum: Story<EmptyProps> = (args, { loaded: fontData }) => {
  const editNode = Editor.util.row('8+10+12+14');

  const semNode = Editor.parse(editNode) as Semantic.types.Add;

  const num10 = semNode.args[1];
  const num12 = semNode.args[2];

  const colorMap = new Map<number, string>();
  if (num10.loc && num12.loc) {
    // Only do this if the indicies of the args differ by one
    const loc = {
      ...num10.loc,
      start: num10.loc.start,
      end: num12.loc.end,
    };

    for (let i = loc.start; i < loc.end; i++) {
      colorMap.set(editNode.children[i].id, 'darkCyan');
    }
  }

  const fontSize = 60;
  const math = applyColorMapToEditorNode(
    editNode,
    colorMap,
  ) as Editor.types.CharRow;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const SimpleSemanticColoring: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
  const editNode = Editor.builders.row([
    Editor.builders.delimited(
      Editor.util.row('11+x').children,
      Editor.builders.char('('),
      Editor.builders.char(')'),
    ),
    Editor.builders.delimited(
      Editor.util.row('12\u2212y').children,
      Editor.builders.char('('),
      Editor.builders.char(')'),
    ),
  ]);

  const colorMap = new Map<number, string>();

  const semNode = Editor.parse(editNode) as Semantic.types.Mul;
  const secondTerm = semNode.args[1] as Semantic.types.Add;
  const num12 = secondTerm.args[0];
  const sum0 = semNode.args[0];

  if (num12.loc) {
    for (let i = num12.loc.start; i < num12.loc.end; i++) {
      colorMap.set(
        // @ts-expect-error: we know the structure
        editNode.children[1].children[0].children[i].id,
        'darkCyan',
      );
    }
  }
  if (sum0.loc) {
    for (let i = sum0.loc.start; i < sum0.loc.end; i++) {
      colorMap.set(
        // @ts-expect-error: we know the structure
        editNode.children[0].children[0].children[i].id,
        'orange',
      );
    }
  }

  const fontSize = 60;
  const math = applyColorMapToEditorNode(
    editNode,
    colorMap,
  ) as Editor.types.CharRow;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const NestedSemanticColoring: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
  const editNode = Editor.builders.row([Editor.util.frac('11+x', '12\u2212y')]);

  const semNode = Editor.parse(editNode) as Semantic.types.Div;
  const denominator = semNode.args[1] as Semantic.types.Add;

  const num12 = denominator.args[0];
  const sum0 = semNode.args[0];

  const colorMap = new Map<number, string>();
  let node;
  if (num12.loc) {
    node = Editor.util.nodeAtPath(editNode, num12.loc.path);
    for (let i = num12.loc.start; i < num12.loc.end; i++) {
      if (Editor.util.hasChildren(node)) {
        colorMap.set(node.children[i].id, 'darkCyan');
      }
    }
  }
  if (sum0.loc) {
    node = Editor.util.nodeAtPath(editNode, sum0.loc.path);
    for (let i = sum0.loc.start; i < sum0.loc.end; i++) {
      if (Editor.util.hasChildren(node)) {
        colorMap.set(node.children[i].id, 'orange');
      }
    }
  }

  const fontSize = 60;
  const math = applyColorMapToEditorNode(
    editNode,
    colorMap,
  ) as Editor.types.CharRow;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} style={style} fontSize={fontSize} />
    </FontDataContext.Provider>
  );
};

export const TallDelimiters: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const TallDelimitersWithCursor: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
  const math = Editor.builders.row([
    Editor.builders.delimited(
      [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])],
      glyph('('),
      glyph(')'),
    ),
    glyph('+'),
    root(null, [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])]),
  ]);

  let state: Editor.SimpleState = {
    row: math,
    selecting: false,
    selection: {
      anchor: { path: [], offset: 0 },
      focus: { path: [], offset: 0 },
    },
  };

  state = Editor.simpleReducer(state, { type: 'ArrowRight' });
  state = Editor.simpleReducer(state, { type: 'ArrowRight' });

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

export const TallDelimitersWithSelection: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
  const math = Editor.builders.row([
    Editor.builders.delimited(
      [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])],
      glyph('('),
      glyph(')'),
    ),
    glyph('+'),
    root(null, [frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])]),
  ]);

  const state: Editor.SimpleState = {
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

export const CursorSize: Story<EmptyProps> = (args, { loaded: fontData }) => {
  const math = row([frac([glyph('1')], [glyph('1'), glyph('+'), glyph('x')])]);

  let state: Editor.SimpleState = {
    row: math,
    selecting: false,
    selection: {
      anchor: { path: [], offset: 0 },
      focus: { path: [], offset: 0 },
    },
  };

  state = Editor.simpleReducer(state, { type: 'ArrowLeft' });
  state = Editor.simpleReducer(state, { type: 'ArrowLeft' });

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={state.row}
        style={style}
        fontSize={fontSize}
        showCursor={true}
        renderMode={Typesetter.RenderMode.Dynamic}
        mathStyle={Typesetter.MathStyle.Text}
      />
    </FontDataContext.Provider>
  );
};

export const SelectionSize: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
  const math = row([
    frac(
      [glyph('1')],
      [
        Editor.builders.delimited(
          [glyph('1'), glyph('+'), glyph('y')],
          glyph('('),
          glyph(')'),
        ),
      ],
    ),
  ]);

  let state: Editor.SimpleState = {
    row: math,
    selecting: false,
    selection: {
      anchor: { path: [], offset: 0 },
      focus: { path: [], offset: 0 },
    },
  };

  state = Editor.simpleReducer(state, { type: 'ArrowLeft' });
  state = Editor.simpleReducer(state, { type: 'ArrowLeft' });
  state = { ...state, selecting: true };
  state = Editor.simpleReducer(state, { type: 'ArrowLeft' });
  state = Editor.simpleReducer(state, { type: 'ArrowLeft' });

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={state.row}
        style={style}
        fontSize={fontSize}
        showCursor={true}
        renderMode={Typesetter.RenderMode.Dynamic}
        mathStyle={Typesetter.MathStyle.Text}
      />
    </FontDataContext.Provider>
  );
};

export const RadicalWithDegreeDynamic: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const RadicalWithLargeDegreeDynamic: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const SubscriptSuperscriptStressTest: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const ScriptsOnTallDelimiters: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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

export const Cancelling: Story<EmptyProps> = (args, { loaded: fontData }) => {
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

export const Matrix: Story<EmptyProps> = (args, { loaded: fontData }) => {
  const matrix = Editor.builders.row([
    Editor.builders.char('A'),
    Editor.builders.char('='),
    Editor.builders.matrix(
      [
        // first row
        [Editor.builders.char('a')],
        [Editor.builders.char('b')],
        [Editor.builders.char('c')],

        // second row
        [Editor.builders.char('d')],
        [
          Editor.builders.char('e'),
          Editor.builders.char('+'),
          Editor.builders.char('1'),
        ],
        [Editor.builders.char('f')],

        // third row
        [Editor.builders.char('0')],
        [Editor.builders.char('0')],
        [Editor.builders.char('1')],
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

export const VerticalWork: Story<EmptyProps> = (args, { loaded: fontData }) => {
  const { builders } = Editor;
  const table = builders.algebra(
    [
      // first row
      [],
      [builders.char('2'), builders.char('x')],
      [],
      [],
      [builders.char('+')],
      [builders.char('5')],
      [],
      [builders.char('=')],
      [],
      [builders.char('1'), builders.char('0')],
      [],

      // second row
      [],
      [],
      [builders.char('\u2212')],
      [builders.char('y')],
      [builders.char('\u2212')],
      [builders.char('5')],
      [],
      [],
      [builders.char('\u2212')],
      [builders.char('5')],
      [],

      // third row
      [],
      [builders.char('2'), builders.char('x')],
      [builders.char('\u2212')],
      [builders.char('y')],
      [builders.char('\u2212')],
      [builders.char('5')],
      [],
      [builders.char('=')],
      [],
      [builders.char('5')],
      [],
    ],
    11,
    3,
  ) as Mutable<Editor.types.CharTable>;
  table.rowStyles = [null, null, { border: 'top' }];
  const verticalWork = builders.row([table]);

  const fontSize = 60;

  return (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={verticalWork}
        style={style}
        fontSize={fontSize}
        renderMode={Typesetter.RenderMode.Dynamic}
      />
    </FontDataContext.Provider>
  );
};

export const InProgressMacro: Story<EmptyProps> = (
  args,
  { loaded: fontData },
) => {
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
