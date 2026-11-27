import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import { UnreachableCaseError } from '@math-blocks/core';
import { macros } from '@math-blocks/tex';

// Turns an editor tree into Presentation MathML, for screen readers.
// MathRenderer renders it, visually hidden, next to the SVG it draws, and
// hides the SVG from assistive technology. Screen readers that support MathML
// (VoiceOver, NVDA with MathCAT, JAWS) then read the math, let users move
// through its parts, and can show it in braille.
//
// The MathML is built from the editor tree rather than the semantic tree:
// that's what MathRenderer draws, and it always works, while parsing to a
// semantic tree fails on incomplete input such as an empty fraction slot.

const { NodeType, AccentType } = Editor;

type Row = Editor.types.CharRow;
type Node = Editor.types.CharNode;

// The character drawn above the base for each accent. These are the
// characters MathML uses for accents, which screen readers know how to read.
const ACCENTS: Readonly<Record<Editor.AccentType, string>> = {
  [AccentType.Hat]: '^',
  [AccentType.Bar]: '¯', // ¯
  [AccentType.Vec]: '→', // →
  [AccentType.Dot]: '˙', // ˙
  [AccentType.DDot]: '¨', // ¨
  [AccentType.Tilde]: '~',
  [AccentType.Acute]: '´', // ´
  [AccentType.Grave]: '`',
};

// Named operators such as "sin" or "lim", longest first. The editor stores one
// typed letter by letter as separate chars, which the typesetter draws as one
// upright word, so they're one <mi> here too.
const NAMED_OPERATORS: readonly string[] = Object.keys(macros)
  .filter((key) => key === macros[key] && key.length > 1)
  .sort((a, b) => b.length - a.length);

const isDigit = (value: string): boolean => /^[0-9]$/.test(value);
const isLetter = (value: string): boolean => /^\p{L}$/u.test(value);

// Returns the named operator that the chars starting at `start` spell, if any.
const namedOperatorAt = (
  children: readonly Node[],
  start: number,
): string | undefined =>
  NAMED_OPERATORS.find((name) =>
    [...name].every((letter, j) => {
      const child = children[start + j];
      return child?.type === 'char' && child.value === letter;
    }),
  );

const char = (value: string): React.ReactElement => {
  if (value.length > 1 || isLetter(value)) {
    // Identifiers, and named operators stored as one char, such as "sin".
    return <mi>{value}</mi>;
  }
  if (isDigit(value)) {
    return <mn>{value}</mn>;
  }
  return <mo>{value}</mo>;
};

const keyed = (elements: readonly React.ReactElement[]): React.ReactElement[] =>
  elements.map((element, index) => React.cloneElement(element, { key: index }));

// A row's children in order, with digits merged into numbers, letters that
// spell a named operator merged into one <mi>, and each subsup wrapped around
// the element before it, which is its base.
const printChildren = (
  children: readonly Node[],
): readonly React.ReactElement[] => {
  const elements: React.ReactElement[] = [];
  let i = 0;
  while (i < children.length) {
    const child = children[i];

    if (child.type === 'char' && isDigit(child.value)) {
      // Digits next to each other, and a decimal point between them, are one
      // number: <mn>12.5</mn>, not <mn>1</mn><mn>2</mn>...
      let number = '';
      while (i < children.length) {
        const next = children[i];
        if (next.type !== 'char') {
          break;
        }
        const after = children[i + 1];
        const isPoint =
          next.value === '.' && after?.type === 'char' && isDigit(after.value);
        if (!isDigit(next.value) && !isPoint) {
          break;
        }
        number += next.value;
        i++;
      }
      elements.push(<mn>{number}</mn>);
      continue;
    }

    const name = namedOperatorAt(children, i);
    if (name) {
      elements.push(<mi>{name}</mi>);
      i += name.length;
      continue;
    }

    if (child.type === NodeType.SubSup) {
      const base = elements.pop() ?? <mrow />;
      elements.push(printSubSup(base, child));
      i++;
      continue;
    }

    elements.push(printNode(child));
    i++;
  }
  return elements;
};

// A row's elements, with runs of children that are crossed out together
// (\cancel) wrapped in a <menclose>, so screen readers say they're crossed
// out. They have no keys; see printElements and printRow.
const printUnkeyed = (row: Row | null): React.ReactElement[] => {
  if (!row) {
    return [];
  }
  const runs: { cancel: number | undefined; nodes: Node[] }[] = [];
  for (const child of row.children) {
    const { cancel } = child.style;
    const last = runs[runs.length - 1];
    if (last && last.cancel === cancel) {
      last.nodes.push(child);
    } else {
      runs.push({ cancel, nodes: [child] });
    }
  }
  return runs.flatMap((run) => {
    const printed = printChildren(run.nodes);
    if (run.cancel === undefined) {
      return printed;
    }
    const crossedOut = (
      <menclose notation="updiagonalstrike">{keyed(printed)}</menclose>
    );
    return [crossedOut];
  });
};

// A row's elements, keyed, for elements such as <msqrt>, <mtd> and <math>
// that wrap their children in an implied <mrow>.
const printElements = (row: Row | null): React.ReactElement[] =>
  keyed(printUnkeyed(row));

// A row as one element: an <mrow> around its elements, or the element itself
// when there's only one, since an <mrow> with one child means the same as
// the child. Used where MathML expects exactly one element, such as each part
// of a fraction or script. A lone element is returned without a key, since
// it's placed next to its siblings, not in an array.
const printRow = (row: Row | null): React.ReactElement => {
  const elements = printUnkeyed(row);
  return elements.length === 1 ? elements[0] : <mrow>{keyed(elements)}</mrow>;
};

const printSubSup = (
  base: React.ReactElement,
  node: Editor.types.CharSubSup,
): React.ReactElement => {
  const [sub, sup] = node.children;
  if (sub && sup) {
    return (
      <msubsup>
        {base}
        {printRow(sub)}
        {printRow(sup)}
      </msubsup>
    );
  }
  if (sub) {
    return (
      <msub>
        {base}
        {printRow(sub)}
      </msub>
    );
  }
  if (sup) {
    return (
      <msup>
        {base}
        {printRow(sup)}
      </msup>
    );
  }
  return base;
};

const fence = (value: string, form: 'prefix' | 'postfix'): React.ReactNode =>
  value ? (
    <mo fence="true" form={form}>
      {value}
    </mo>
  ) : null;

const printTable = (node: Editor.types.CharTable): React.ReactElement => {
  const { rowCount, colCount, children, delimiters } = node;
  const rows: React.ReactElement[] = [];
  for (let i = 0; i < rowCount; i++) {
    const cells: React.ReactElement[] = [];
    for (let j = 0; j < colCount; j++) {
      // <mtd>, like <msqrt> and <math>, wraps its children in an implied
      // <mrow>, so they don't need one.
      cells.push(
        <mtd key={j}>{printElements(children[i * colCount + j])}</mtd>,
      );
    }
    rows.push(<mtr key={i}>{cells}</mtr>);
  }
  const table = <mtable>{rows}</mtable>;
  if (!delimiters) {
    return table;
  }
  return (
    <mrow>
      {fence(delimiters.left.value, 'prefix')}
      {table}
      {fence(delimiters.right.value, 'postfix')}
    </mrow>
  );
};

const printNode = (node: Node): React.ReactElement => {
  switch (node.type) {
    case 'char':
      return char(node.value);
    case NodeType.Row:
      return printRow(node);
    case NodeType.Frac: {
      const [numerator, denominator] = node.children;
      return (
        <mfrac>
          {printRow(numerator)}
          {printRow(denominator)}
        </mfrac>
      );
    }
    case NodeType.SubSup:
      // A subsup at the start of a row has no base.
      return printSubSup(<mrow />, node);
    case NodeType.Root: {
      const [index, radicand] = node.children;
      if (!index || index.children.length === 0) {
        return <msqrt>{printElements(radicand)}</msqrt>;
      }
      return (
        <mroot>
          {printRow(radicand)}
          {printRow(index)}
        </mroot>
      );
    }
    case NodeType.Delimited: {
      const [inner] = node.children;
      return (
        <mrow>
          {fence(node.leftDelim.value, 'prefix')}
          {printRow(inner)}
          {fence(node.rightDelim.value, 'postfix')}
        </mrow>
      );
    }
    case NodeType.Accent: {
      const [inner] = node.children;
      return (
        <mover accent="true">
          {printRow(inner)}
          <mo>{ACCENTS[node.accent]}</mo>
        </mover>
      );
    }
    case NodeType.Limits: {
      const [lower, upper] = node.children;
      const inner = printNode(node.inner);
      if (upper) {
        return (
          <munderover>
            {inner}
            {printRow(lower)}
            {printRow(upper)}
          </munderover>
        );
      }
      return (
        <munder>
          {inner}
          {printRow(lower)}
        </munder>
      );
    }
    case NodeType.Table:
      return printTable(node);
    case NodeType.Macro:
      // A macro that's still being typed, such as "\sq".
      return (
        <mrow>
          <mo>\</mo>
          {printRow(node.children[0])}
        </mrow>
      );
    default:
      throw new UnreachableCaseError(node);
  }
};

// Hides the MathML visually while keeping it in the accessibility tree. This
// is the usual "visually hidden" technique; display: none or
// visibility: hidden would hide it from screen readers too. It's set on a
// <span> around the <math>, since a <math> element has no `style` property in
// jsdom or in browsers without MathML Core support (Chrome before 109).
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

type Props = {
  readonly row: Row;
  readonly display: 'block' | 'inline';
};

/**
 * Presentation MathML for an editor row, hidden visually but not from
 * assistive technology. MathRenderer renders it next to its SVG.
 */
export const HiddenMathml: React.FC<Props> = ({ row, display }) => (
  <span style={VISUALLY_HIDDEN}>
    <math xmlns="http://www.w3.org/1998/Math/MathML" display={display}>
      {printElements(row)}
    </math>
  </span>
);
