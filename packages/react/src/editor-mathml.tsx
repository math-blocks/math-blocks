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
// All of its letters must be crossed out (\cancel) alike.
const namedOperatorAt = (
  children: readonly Node[],
  start: number,
): string | undefined => {
  const { cancel } = children[start].style;
  return NAMED_OPERATORS.find((name) =>
    [...name].every((letter, j) => {
      const child = children[start + j];
      return (
        child?.type === 'char' &&
        child.value === letter &&
        child.style.cancel === cancel
      );
    }),
  );
};

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

// Wraps an element in a crossed-out <menclose> if it's crossed out (\cancel),
// so screen readers say so.
const crossOut = (
  element: React.ReactElement,
  cancel: number | undefined,
): React.ReactElement =>
  cancel === undefined ? (
    element
  ) : (
    <menclose notation="updiagonalstrike">{element}</menclose>
  );

// An element of a row, with the cancel ID (\cancel) of the nodes it came from.
type Printed = {
  readonly element: React.ReactElement;
  readonly cancel: number | undefined;
};

// A row's children in order, with digits merged into numbers, letters that
// spell a named operator merged into one <mi>, and each subsup wrapped around
// the element before it, which is its base. Nodes are only merged when
// they're crossed out alike.
const printChildren = (children: readonly Node[]): Printed[] => {
  const printed: Printed[] = [];
  let i = 0;
  while (i < children.length) {
    const child = children[i];
    const { cancel } = child.style;

    if (child.type === 'char' && isDigit(child.value)) {
      // Digits next to each other, and a decimal point between them, are one
      // number: <mn>12.5</mn>, not <mn>1</mn><mn>2</mn>...
      let number = '';
      while (i < children.length) {
        const next = children[i];
        if (next.type !== 'char' || next.style.cancel !== cancel) {
          break;
        }
        const after = children[i + 1];
        const isPoint =
          next.value === '.' &&
          after?.type === 'char' &&
          after.style.cancel === cancel &&
          isDigit(after.value);
        if (!isDigit(next.value) && !isPoint) {
          break;
        }
        number += next.value;
        i++;
      }
      printed.push({ element: <mn>{number}</mn>, cancel });
      continue;
    }

    const name = namedOperatorAt(children, i);
    if (name) {
      printed.push({ element: <mi>{name}</mi>, cancel });
      i += name.length;
      continue;
    }

    if (child.type === NodeType.SubSup) {
      const base = printed.pop() ?? { element: <mrow />, cancel };
      if (base.cancel === cancel) {
        printed.push({ element: printSubSup(base.element, child), cancel });
      } else {
        // The base and its scripts are crossed out differently, so each is
        // crossed out on its own, inside the script element.
        printed.push({
          element: printSubSup(
            crossOut(base.element, base.cancel),
            child,
            cancel,
          ),
          cancel: undefined,
        });
      }
      i++;
      continue;
    }

    printed.push({ element: printNode(child), cancel });
    i++;
  }
  return printed;
};

// A row's elements, with runs of elements that are crossed out together
// (\cancel) wrapped in one <menclose>, so screen readers say they're crossed
// out. They have no keys; see printElements and printRow.
const printUnkeyed = (row: Row | null): React.ReactElement[] => {
  if (!row) {
    return [];
  }
  const runs: { cancel: number | undefined; elements: React.ReactElement[] }[] =
    [];
  for (const { element, cancel } of printChildren(row.children)) {
    const last = runs[runs.length - 1];
    if (last && last.cancel === cancel) {
      last.elements.push(element);
    } else {
      runs.push({ cancel, elements: [element] });
    }
  }
  return runs.flatMap((run) => {
    if (run.cancel === undefined) {
      return run.elements;
    }
    const crossedOut = (
      <menclose notation="updiagonalstrike">{keyed(run.elements)}</menclose>
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
const printRow = (row: Row | null): React.ReactElement =>
  group(printUnkeyed(row));

// Wraps a subsup's scripts around its base. `cancel` crosses out the scripts
// on their own, for when they're crossed out (\cancel) but the base isn't, or
// the other way around; otherwise the whole element is crossed out together.
const printSubSup = (
  base: React.ReactElement,
  node: Editor.types.CharSubSup,
  cancel?: number,
): React.ReactElement => {
  const [subRow, supRow] = node.children;
  const sub = subRow && crossOut(printRow(subRow), cancel);
  const sup = supRow && crossOut(printRow(supRow), cancel);
  if (sub && sup) {
    return (
      <msubsup>
        {base}
        {sub}
        {sup}
      </msubsup>
    );
  }
  if (sub) {
    return (
      <msub>
        {base}
        {sub}
      </msub>
    );
  }
  if (sup) {
    return (
      <msup>
        {base}
        {sup}
      </msup>
    );
  }
  return base;
};

const fence = (
  value: string,
  form: 'prefix' | 'postfix',
): React.ReactElement | null =>
  value ? (
    <mo fence="true" form={form}>
      {value}
    </mo>
  ) : null;

// Groups elements in an <mrow>, leaving out any that are null, or returns the
// element itself if there's only one.
const group = (
  parts: readonly (React.ReactElement | null)[],
): React.ReactElement => {
  const elements = parts.filter(
    (part): part is React.ReactElement => part !== null,
  );
  return elements.length === 1 ? elements[0] : <mrow>{keyed(elements)}</mrow>;
};

// The contents of a pair of delimiters, or null when there's nothing between
// them, so that "()" is <mo>(</mo><mo>)</mo> without an empty <mrow>.
const printContents = (row: Row): React.ReactElement | null =>
  row.children.length === 0 ? null : printRow(row);

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
  return group([
    fence(delimiters.left.value, 'prefix'),
    table,
    fence(delimiters.right.value, 'postfix'),
  ]);
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
      // The contents keep their own <mrow> when there's more than one
      // element, as in the MathML spec's examples, so screen readers can move
      // into what's between the delimiters as one part.
      const [inner] = node.children;
      return group([
        fence(node.leftDelim.value, 'prefix'),
        printContents(inner),
        fence(node.rightDelim.value, 'postfix'),
      ]);
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
    case NodeType.Macro: {
      // A macro that's still being typed, such as "\sq".
      const backslash = <mo>\</mo>;
      return group([backslash, ...printUnkeyed(node.children[0])]);
    }
    default:
      throw new UnreachableCaseError(node);
  }
};

// Hides the MathML visually while keeping it in the accessibility tree. This
// is the usual "visually hidden" technique; display: none or
// visibility: hidden would hide it from screen readers too. It's set on a
// <span> around the <math>, since a <math> element has no `style` property in
// jsdom or in browsers without MathML Core support (Chrome before 109).
//
// It also can't be selected, so that a text selection across the math doesn't
// copy the MathML's text, e.g. "x2+1" for x² + 1. MathRenderer copies TeX in
// its place (see native-selection.ts); before it hydrates, or without
// JavaScript, the math is left out of what's copied. This doesn't change what
// screen readers read.
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
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

type Props = {
  readonly row: Row;
  readonly display: 'block' | 'inline';
};

/**
 * A <math> element for an editor row.
 */
export const mathElement = (
  row: Row,
  display: 'block' | 'inline',
): React.ReactElement => (
  <math xmlns="http://www.w3.org/1998/Math/MathML" display={display}>
    {printElements(row)}
  </math>
);

/**
 * Presentation MathML for an editor row, hidden visually but not from
 * assistive technology. MathRenderer renders it next to its SVG.
 */
export const HiddenMathml = React.forwardRef<HTMLSpanElement, Props>(
  ({ row, display }, ref) => (
    <span ref={ref} style={VISUALLY_HIDDEN}>
      {mathElement(row, display)}
    </span>
  ),
);

HiddenMathml.displayName = 'HiddenMathml';
