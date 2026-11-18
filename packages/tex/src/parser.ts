import { types, builders, isAccentType } from '@math-blocks/editor';

import { macros } from './macros';

class Parser {
  // eslint-disable-next-line functional/prefer-readonly-type
  index: number;
  readonly input: string;
  // eslint-disable-next-line functional/prefer-readonly-type
  readonly leftDelims: string[];
  // eslint-disable-next-line functional/prefer-readonly-type
  readonly rightDelims: string[];
  // The terminator that ended the last call to parseRow(), or 'right' if it
  // was ended by `\right`.
  // eslint-disable-next-line functional/prefer-readonly-type
  lastTerminator: string | undefined;
  // Indexes of bare `(` and `|` chars that we already know have no matching
  // closing delimiter.  This avoids re-parsing the same text over and over
  // when there are many unmatched delimiters.
  // eslint-disable-next-line functional/prefer-readonly-type
  readonly unmatched: Set<number>;

  constructor(input: string) {
    this.index = 0;
    this.input = input;
    this.leftDelims = [];
    this.rightDelims = [];
    this.lastTerminator = undefined;
    this.unmatched = new Set();
  }

  peek(): string {
    return this.input[this.index];
  }

  consume(): void {
    this.index++;
  }

  parse(): types.CharRow {
    const [row] = this.parseRow();
    return row;
  }

  parseNode(): types.CharNode {
    if (this.index >= this.input.length) {
      throw new Error('unexpected end of input');
    }
    const char = this.peek();

    switch (char) {
      case '{': {
        this.consume(); // '{'
        const [row] = this.parseRow(['}']);
        return row;
      }
      case '_': {
        this.consume(); // '_'
        const sub = this.parseScript();
        if (this.input[this.index] === '^') {
          this.index += 1;
          const sup = this.parseScript();
          return builders.subsup(sub, sup);
        }
        return builders.subsup(sub);
      }
      case '^': {
        this.consume(); // '^'
        const sup = this.parseScript();
        return builders.subsup(undefined, sup);
      }
      case '\\': {
        this.consume(); // '\\'
        let name = '';
        while (this.index < this.input.length) {
          const nextChar = this.input[this.index];
          if (/[a-zA-Z]/.test(nextChar)) {
            name += nextChar;
            this.index += 1;
          } else {
            break;
          }
        }
        return this.parseCommand(name);
      }
      case '}': {
        throw new Error('unexpected rbrace');
      }
      case ' ': {
        this.consume(); // ' '
        return this.parseNode();
      }
      case '-': {
        this.consume(); // '-'
        // TeX uses the ASCII hyphen-minus for subtraction and negation, but the
        // editor represents them with the minus sign (U+2212).
        return builders.char('\u2212');
      }
      default: {
        this.consume();
        return builders.char(char);
      }
    }
  }

  /**
   * Parses the subscript or superscript after a `_` or `^`.
   *
   * TeX reads `x^-2` as `x^{-}2`, but math input fields produce it for
   * `x^{-2}`, so a leading `-` takes the node after it along with it.
   */
  parseScript(): types.CharNode[] {
    while (this.peek() === ' ') {
      this.consume();
    }
    if (this.index >= this.input.length) {
      throw new Error('expected a subscript or superscript');
    }
    const nodes: types.CharNode[] = [];
    if (this.peek() === '-') {
      this.consume(); // '-'
      nodes.push(builders.char('\u2212'));
      while (this.peek() === ' ') {
        this.consume();
      }
      if (this.index >= this.input.length) {
        return nodes;
      }
    }
    const node = this.parseNode();
    nodes.push(...(node.type === 'row' ? node.children : [node]));
    return nodes;
  }

  /**
   * Parses a bare `(…)` or `|…|`, starting at the opening delimiter, into a
   * delimited node, the same node `\left(…\right)` or `\left|…\right|`
   * produces.  If there's no closing delimiter before the end of the enclosing
   * group, it restores the index and returns null, and the caller treats the
   * opening delimiter as a plain char, e.g. in the interval `[0, 1)`.
   */
  tryParseDelimited(
    open: '(' | '|',
    terminators: readonly Terminator[],
  ): types.CharDelimited | null {
    const start = this.index;
    if (this.unmatched.has(start)) {
      return null;
    }
    const close = open === '(' ? ')' : '|';
    this.consume(); // open
    const [inner] = this.parseRow([close, ...terminators]);
    if (this.lastTerminator === close) {
      return builders.delimited(
        inner.children,
        builders.char(open),
        builders.char(close),
      );
    }
    this.unmatched.add(start);
    this.index = start;
    return null;
  }

  parseIdentifier(): string {
    let ident = '';
    while (this.index < this.input.length) {
      const nextChar = this.input[this.index];
      if (/[a-zA-Z]/.test(nextChar)) {
        ident += nextChar;
        this.index += 1;
      } else {
        break;
      }
    }
    return ident;
  }

  parseCommand(name: string): types.CharNode {
    switch (name) {
      case 'frac': {
        const num = this.parseNode();
        const den = this.parseNode();

        return builders.frac(
          num.type === 'row' ? num.children : [num],
          den.type === 'row' ? den.children : [den],
        );
      }
      case 'sqrt': {
        let index: types.CharNode | null = null;
        if (this.input[this.index] === '[') {
          this.consume(); // '['
          [index] = this.parseRow([']']);
        }
        const radicand = this.parseNode();
        return builders.root(
          index ? index.children : null,
          radicand.type === 'row' ? radicand.children : [radicand],
        );
      }
      case 'left': {
        // TODO: check if it's a valid delimiter
        const leftDelim = this.peek();
        this.consume(); // left delimiter
        const [inner, rightDelim] = this.parseRow(['right']);
        if (!rightDelim) {
          throw new Error('no right delimiter');
        }
        return builders.delimited(
          inner.children,
          builders.char(leftDelim),
          builders.char(rightDelim),
        );
      }
      case 'begin': {
        if (this.peek() !== '{') {
          throw new Error('expected {');
        }
        this.consume(); // '{'
        const startName = this.parseIdentifier();
        if (this.peek() !== '}') {
          throw new Error('expected }');
        }
        this.consume(); // '}'

        let cell: types.CharRow;
        let terminator: string | undefined;

        const cells: types.CharRow[] = [];

        // TODO: report an error if the number of columns is inconsistent
        let currentCol = 0;
        let colCount = 0;
        let rowCount = 0;

        while (terminator !== 'end' && this.index < this.input.length) {
          [cell, terminator] = this.parseRow(['&', '\\', 'end']);
          if (terminator === '&') {
            currentCol += 1;
            cells.push(cell);
          }
          if (terminator === '\\' || terminator === 'end') {
            cells.push(cell);
            currentCol += 1;
            if (terminator === '\\' && rowCount === 0) {
              colCount = currentCol;
            }
            if (currentCol !== colCount) {
              throw new Error('inconsistent number of columns');
            }
            rowCount += 1;
            if (terminator === '\\') {
              currentCol = 0;
            }
          }
        }

        if (terminator !== 'end') {
          throw new Error('expected \\end');
        }

        if (this.peek() !== '{') {
          throw new Error('expected {');
        }
        this.consume(); // '{'
        const endName = this.parseIdentifier();
        if (this.peek() !== '}') {
          throw new Error('expected }');
        }
        this.consume(); // '}'

        if (startName !== endName) {
          throw new Error('mismatched begin/end');
        }

        let delimeters = undefined;
        if (startName === 'bmatrix' && endName === 'bmatrix') {
          delimeters = {
            left: builders.char('['),
            right: builders.char(']'),
          };
        } else if (startName === 'pmatrix' && endName === 'pmatrix') {
          delimeters = {
            left: builders.char('('),
            right: builders.char(')'),
          };
        }

        if (!matrixTypes.includes(startName)) {
          throw new Error('unknown matrix type');
        }

        colCount; //
        return builders.matrix(cells, rowCount, colCount, delimeters);
      }
      default:
        if (isAccentType(name)) {
          const inner = this.parseNode();
          return builders.accent(
            inner.type === 'row' ? inner.children : [inner],
            name,
          );
        }
        if (macros[name]) {
          return builders.char(macros[name]);
        }
        if (name === 'right') {
          throw new Error('unexpected right delimiter');
        }
        throw new Error(`unknown command: ${name}`);
    }
  }

  // TODO: ensure there are no unclosed braces
  // TODO: return the terminator that was used to end the row if there was one
  parseRow(
    terminators: readonly Terminator[] = [],
  ): [types.CharRow, string | undefined] {
    const nodes: types.CharNode[] = [];
    this.lastTerminator = undefined;
    while (this.index < this.input.length) {
      const char = this.input[this.index];

      if (char === '\\') {
        this.consume(); // '\\'
        let name = this.parseIdentifier();

        if (name === '' && this.peek() === '\\') {
          name = '\\';
          this.consume(); // '\\'
        }

        if (isTerminator(name) && terminators.includes(name)) {
          this.lastTerminator = name;
          if (name === 'right') {
            // TODO: check if it's a valid delimiter
            const rightDelim = this.input[this.index];
            this.consume(); // right delimiter
            return [builders.row(nodes), rightDelim];
          } else if (name === 'end' || name === '\\') {
            return [builders.row(nodes), name];
          } else {
            const rightDelim = this.input[this.index];
            return [builders.row(nodes), rightDelim];
          }
        } else {
          nodes.push(this.parseCommand(name));
          continue;
        }
      }

      if (char === ' ') {
        this.consume(); // ' '
        continue;
      }

      // A `|` closes an absolute value only if it comes after an operand,
      // otherwise it opens a new one, e.g. the second `|` in `||x|-1|`.
      const isClosingBar =
        char === '|' &&
        nodes.length > 0 &&
        !isOperator(nodes[nodes.length - 1]);

      if (
        isTerminator(char) &&
        terminators.includes(char) &&
        (char !== '|' || isClosingBar)
      ) {
        this.consume(); // terminator
        this.lastTerminator = char;
        return [builders.row(nodes), char];
      }

      if (char === '(' || char === '|') {
        const delimited = this.tryParseDelimited(char, terminators);
        if (delimited) {
          nodes.push(delimited);
          continue;
        }
      }

      nodes.push(this.parseNode());
    }
    this.lastTerminator = undefined;
    return [builders.row(nodes), undefined];
  }
}

const matrixTypes = ['bmatrix', 'pmatrix'];

type Terminator = '&' | '\\' | '}' | ']' | ')' | '|' | 'right' | 'end';

const isTerminator = (name: string): name is Terminator =>
  ['&', '\\', '}', ']', ')', '|', 'right', 'end'].includes(name);

// Chars after which a `|` opens an absolute value rather than closing one.
const OPERATORS = [
  '+',
  '\u2212',
  '\u00b1',
  '\u2213',
  '*',
  '\u00b7',
  '\u00d7',
  '\u22c5',
  '\u00f7',
  '=',
  '\u2260',
  '<',
  '>',
  '\u2264',
  '\u2265',
  ',',
];

const isOperator = (node: types.CharNode): boolean =>
  node.type === 'char' && OPERATORS.includes(node.value);

export const parse = (input: string): types.CharRow => {
  const parser = new Parser(input);
  return parser.parse();
};
