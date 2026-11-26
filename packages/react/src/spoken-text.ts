import * as Editor from '@math-blocks/editor';
import { UnreachableCaseError } from '@math-blocks/core';
import { macros } from '@math-blocks/tex';

// Turns an editor tree into English text for a screen reader to speak, for
// example "x squared plus 1 over 2". MathRenderer uses it as the SVG's
// aria-label. The wording follows the conventions of MathSpeak and ClearSpeak
// loosely: short forms ("x squared", "3 over 4", "the square root of 2") for
// simple sub-expressions, and an explicit end marker (", end fraction") after
// compound ones so that a listener can tell where they stop.

const { NodeType, AccentType } = Editor;

type Row = Editor.types.CharRow;
type Node = Editor.types.CharNode;

// What a single character is read as. Characters that aren't listed are read
// as themselves; screen readers already know how to say letters, digits and
// most symbols, and they speak them in the user's own voice settings.
const CHAR_NAMES: Readonly<Record<string, string>> = {
  '+': 'plus',
  '-': 'minus',
  '−': 'minus',
  '±': 'plus or minus',
  '∓': 'minus or plus',
  '×': 'times',
  '⋅': 'times',
  '*': 'times',
  '∗': 'times',
  '/': 'divided by',
  '÷': 'divided by',
  '=': 'equals',
  '≠': 'is not equal to',
  '<': 'is less than',
  '>': 'is greater than',
  '≤': 'is less than or equal to',
  '≥': 'is greater than or equal to',
  '≈': 'is approximately equal to',
  '∞': 'infinity',
  '∂': 'partial',
  '′': 'prime',
  "'": 'prime',
  '!': 'factorial',
  '%': 'percent',
  ',': 'comma',
  ':': 'colon',
  '(': 'open paren',
  ')': 'close paren',
  '[': 'open bracket',
  ']': 'close bracket',
  '{': 'open brace',
  '}': 'close brace',
  '|': 'vertical bar',
  '∫': 'integral',
  '∬': 'double integral',
  '∭': 'triple integral',
  '∑': 'sum',
  '∏': 'product',
  '∈': 'is an element of',
  '∉': 'is not an element of',
  '∋': 'contains',
  '∌': 'does not contain',
  '⊂': 'is a subset of',
  '⊃': 'is a superset of',
  '⊆': 'is a subset of or equal to',
  '⊇': 'is a superset of or equal to',
  '→': 'right arrow',
  '←': 'left arrow',
  '↑': 'up arrow',
  '↓': 'down arrow',
  ℂ: 'the complex numbers',
  ℍ: 'the quaternions',
  ℕ: 'the natural numbers',
  ℙ: 'the primes',
  ℚ: 'the rational numbers',
  ℝ: 'the real numbers',
  ℤ: 'the integers',
  Α: 'capital alpha',
  Β: 'capital beta',
  Γ: 'capital gamma',
  Δ: 'capital delta',
  Ε: 'capital epsilon',
  Ζ: 'capital zeta',
  Η: 'capital eta',
  Θ: 'capital theta',
  Ι: 'capital iota',
  Κ: 'capital kappa',
  Λ: 'capital lambda',
  Μ: 'capital mu',
  Ν: 'capital nu',
  Ξ: 'capital xi',
  Ο: 'capital omicron',
  Π: 'capital pi',
  Ρ: 'capital rho',
  Σ: 'capital sigma',
  Τ: 'capital tau',
  Υ: 'capital upsilon',
  Φ: 'capital phi',
  Χ: 'capital chi',
  Ψ: 'capital psi',
  Ω: 'capital omega',
  α: 'alpha',
  β: 'beta',
  γ: 'gamma',
  δ: 'delta',
  ε: 'epsilon',
  ζ: 'zeta',
  η: 'eta',
  θ: 'theta',
  ι: 'iota',
  κ: 'kappa',
  λ: 'lambda',
  μ: 'mu',
  ν: 'nu',
  ξ: 'xi',
  ο: 'omicron',
  π: 'pi',
  ρ: 'rho',
  ς: 'final sigma',
  σ: 'sigma',
  τ: 'tau',
  υ: 'upsilon',
  φ: 'phi',
  χ: 'chi',
  ψ: 'psi',
  ω: 'omega',
};

// Named operators such as "sin" are stored as one multi-letter char. Most are
// read as written; these are read as words.
const OPERATOR_NAMES: Readonly<Record<string, string>> = {
  ln: 'natural log',
  lim: 'limit',
  limsup: 'limit superior',
  liminf: 'limit inferior',
  min: 'minimum',
  max: 'maximum',
  gcd: 'greatest common divisor',
  lcm: 'least common multiple',
  det: 'determinant',
  dim: 'dimension',
  mod: 'mod',
};

const DELIMITERS: Readonly<
  Record<string, { readonly open: string; readonly close: string }>
> = {
  '(': { open: 'open paren', close: 'close paren' },
  '[': { open: 'open bracket', close: 'close bracket' },
  '{': { open: 'open brace', close: 'close brace' },
  '⟨': { open: 'open angle bracket', close: 'close angle bracket' },
  '‖': { open: 'the norm of', close: 'end norm' },
  '|': { open: 'the absolute value of', close: 'end absolute value' },
  '⌊': { open: 'the floor of', close: 'end floor' },
  '⌈': { open: 'the ceiling of', close: 'end ceiling' },
};

const ACCENTS: Readonly<Record<Editor.AccentType, (body: string) => string>> = {
  [AccentType.Hat]: (body) => `${body} hat`,
  [AccentType.Bar]: (body) => `${body} bar`,
  [AccentType.Vec]: (body) => `vector ${body}`,
  [AccentType.Dot]: (body) => `${body} dot`,
  [AccentType.DDot]: (body) => `${body} double dot`,
  [AccentType.Tilde]: (body) => `${body} tilde`,
  [AccentType.Acute]: (body) => `${body} acute`,
  [AccentType.Grave]: (body) => `${body} grave`,
};

const isDigit = (value: string): boolean => /^[0-9]$/.test(value);

// Named operators such as "sin" or "lim", longest first. The editor stores one
// typed letter by letter as separate chars, which the typesetter draws as one
// upright word; they're read as one word too.
const NAMED_OPERATORS: readonly string[] = Object.keys(macros)
  .filter((key) => key === macros[key] && key.length > 1)
  .sort((a, b) => b.length - a.length);

// Replaces each run of single-letter chars that spells a named operator with
// one char holding the whole name.
const groupOperators = (children: readonly Node[]): readonly Node[] => {
  const result: Node[] = [];
  let i = 0;
  while (i < children.length) {
    const child = children[i];
    if (child.type === 'char' && /^[a-z]$/.test(child.value)) {
      const name = NAMED_OPERATORS.find((op) =>
        [...op].every((letter, j) => {
          const other = children[i + j];
          return other?.type === 'char' && other.value === letter;
        }),
      );
      if (name) {
        result.push({ ...child, value: name });
        i += name.length;
        continue;
      }
    }
    result.push(child);
    i++;
  }
  return result;
};

const speakChar = (value: string): string => {
  if (value.length > 1) {
    return OPERATOR_NAMES[value] ?? value;
  }
  return CHAR_NAMES[value] ?? value;
};

// A row is "simple" when it's a number or a single character, so that "x
// squared" or "1 over 2" can't be misheard as covering more than it does.
const isSimple = (row: Row): boolean => {
  const { children } = row;
  if (children.length === 0) {
    return false;
  }
  if (children.length === 1) {
    return children[0].type === 'char';
  }
  for (const child of children) {
    if (
      child.type !== 'char' ||
      !(isDigit(child.value) || child.value === '.')
    ) {
      return false;
    }
  }
  return true;
};

const ORDINALS: Readonly<Record<string, string>> = {
  '2': 'squared',
  '3': 'cubed',
};

type Context = {
  // Set while reading the lower limit of "lim", where an arrow means
  // "approaches".
  readonly inLimit?: boolean;
};

const speakRow = (row: Row | null, context: Context): string => {
  if (!row || row.children.length === 0) {
    return 'blank';
  }

  const words: string[] = [];
  let number = '';
  const flush = (): void => {
    if (number) {
      words.push(number);
      number = '';
    }
  };

  const children = groupOperators(row.children);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const next = children[i + 1];
    if (isBoundedOperator(child) && next?.type === NodeType.SubSup) {
      flush();
      const [lower, upper] = next.children;
      const bounds = speakBounds(child, lower, upper, context);
      // "sum from i equals 1 to n of i": "of" introduces the operand.
      words.push(i + 2 < children.length ? `${bounds} of` : bounds);
      i++;
      continue;
    }
    if (child.type === NodeType.Limits) {
      flush();
      const bounds = speakNode(child, context);
      words.push(i + 1 < children.length ? `${bounds} of` : bounds);
      continue;
    }
    // Digits and decimal points next to each other are one number: "12.5",
    // not "1 2 point 5".
    if (
      child.type === 'char' &&
      (isDigit(child.value) || (child.value === '.' && number !== ''))
    ) {
      number += child.value;
      continue;
    }
    flush();
    words.push(speakNode(child, context));
  }
  flush();

  return words.join(' ');
};

const speakPower = (exponent: Row): string => {
  if (isSimple(exponent)) {
    const text = speakRow(exponent, {});
    return ORDINALS[text] ?? `to the power of ${text}`;
  }
  return `to the power of ${speakRow(exponent, {})}, end power`;
};

const speakSubscript = (subscript: Row, context: Context): string => {
  const text = speakRow(subscript, context);
  return isSimple(subscript) ? `sub ${text}` : `sub ${text}, end sub`;
};

const speakTable = (node: Editor.types.CharTable, context: Context): string => {
  const { rowCount, colCount, children } = node;
  const rows: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const cells: string[] = [];
    for (let j = 0; j < colCount; j++) {
      cells.push(speakRow(children[i * colCount + j] ?? null, context));
    }
    rows.push(`row ${i + 1}: ${cells.join(', ')}`);
  }
  const plural = (count: number, word: string): string =>
    `${count} ${word}${count === 1 ? '' : 's'}`;
  return `matrix with ${plural(rowCount, 'row')} and ${plural(
    colCount,
    'column',
  )}, ${rows.join('; ')}, end matrix`;
};

// Large operators such as sums, integrals and limits, whose subscript and
// superscript are read as bounds ("sum from i equals 1 to n") rather than as
// a subscript and a power.
const BOUNDED_OPERATORS: readonly string[] = [
  '\u2211',
  '\u220f',
  '\u222b',
  '\u222c',
  '\u222d',
  'lim',
  'limsup',
  'liminf',
];

const isBoundedOperator = (node: Node | undefined): boolean =>
  node?.type === 'char' && BOUNDED_OPERATORS.includes(node.value);

// The name of the operator a limits node is attached to, such as "lim". It can
// be a char, or a row of chars that spell it.
const getOperatorName = (node: Node): string | undefined => {
  if (node.type === 'char') {
    return node.value;
  }
  if (node.type === NodeType.Row) {
    const children = groupOperators(node.children);
    const [only] = children;
    return children.length === 1 && only.type === 'char'
      ? only.value
      : undefined;
  }
  return undefined;
};

// Reads a large operator with its bounds, from either a limits node or a char
// followed by a subsup.
const speakBounds = (
  operator: Node,
  lower: Row | null,
  upper: Row | null,
  context: Context,
): string => {
  const name = speakNode(operator, context);
  const isLim = getOperatorName(operator)?.startsWith('lim') ?? false;
  const hasLower = !!lower && lower.children.length > 0;
  const hasUpper = !!upper && upper.children.length > 0;
  const lowerText = hasLower
    ? speakRow(lower, { ...context, inLimit: isLim })
    : '';
  const upperText = hasUpper ? speakRow(upper, context) : '';
  if (hasLower && hasUpper) {
    return `${name} from ${lowerText} to ${upperText}`;
  }
  if (hasLower) {
    return isLim ? `${name} as ${lowerText}` : `${name} over ${lowerText}`;
  }
  if (hasUpper) {
    return `${name} to ${upperText}`;
  }
  return name;
};

const speakNode = (node: Node, context: Context): string => {
  switch (node.type) {
    case 'char':
      if (context.inLimit && node.value === '→') {
        return 'approaches';
      }
      return speakChar(node.value);
    case NodeType.Row:
      return speakRow(node, context);
    case NodeType.Frac: {
      const [numerator, denominator] = node.children;
      const num = speakRow(numerator, context);
      const den = speakRow(denominator, context);
      if (isSimple(numerator) && isSimple(denominator)) {
        return `${num} over ${den}`;
      }
      return `the fraction ${num} over ${den}, end fraction`;
    }
    case NodeType.SubSup: {
      const [sub, sup] = node.children;
      const parts: string[] = [];
      if (sub) {
        parts.push(speakSubscript(sub, context));
      }
      if (sup) {
        parts.push(speakPower(sup));
      }
      return parts.join(' ');
    }
    case NodeType.Root: {
      const [index, radicand] = node.children;
      const body = speakRow(radicand, context);
      const end = isSimple(radicand) ? '' : ', end root';
      if (!index || index.children.length === 0) {
        return `the square root of ${body}${end}`;
      }
      const indexText = speakRow(index, context);
      if (indexText === '3') {
        return `the cube root of ${body}${end}`;
      }
      return `the root with index ${indexText} of ${body}${end}`;
    }
    case NodeType.Delimited: {
      const [inner] = node.children;
      const left = node.leftDelim.value;
      const right = node.rightDelim.value;
      const body = speakRow(inner, context);
      const known = DELIMITERS[left];
      if (known && (left !== '|' || right === '|')) {
        // "the absolute value of x, end absolute value" gets a pause before
        // its end marker, like the other compound forms; brackets don't.
        const separator = known.close.startsWith('end') ? ', ' : ' ';
        return `${known.open} ${body}${separator}${known.close}`;
      }
      // Unmatched or unusual delimiters are read one at a time.
      const open = left ? speakChar(left) : '';
      const close = right ? speakChar(right) : '';
      return [open, body, close].filter(Boolean).join(' ');
    }
    case NodeType.Accent: {
      const [inner] = node.children;
      return ACCENTS[node.accent](speakRow(inner, context));
    }
    case NodeType.Limits: {
      const [lower, upper] = node.children;
      return speakBounds(node.inner, lower, upper, context);
    }
    case NodeType.Table:
      return speakTable(node, context);
    case NodeType.Macro:
      // A macro that's still being typed, such as "\sq".
      return `backslash ${speakRow(node.children[0], context)}`;
    default:
      throw new UnreachableCaseError(node);
  }
};

/**
 * Returns English text that a screen reader can speak for the given math, for
 * example "x squared plus 1" for x² + 1. MathRenderer uses it as its default
 * `aria-label`.
 */
export const getSpokenText = (row: Editor.types.CharRow): string => {
  if (row.children.length === 0) {
    return 'blank';
  }
  return speakRow(row, {}).replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
};
