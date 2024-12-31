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

  constructor(input: string) {
    this.index = 0;
    this.input = input;
    this.leftDelims = [];
    this.rightDelims = [];
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
    const char = this.peek();

    switch (char) {
      case '{': {
        this.consume(); // '{'
        const [row] = this.parseRow(['}']);
        return row;
      }
      case '_': {
        this.consume(); // '_'
        const sub = this.parseNode();
        if (this.input[this.index] === '^') {
          this.index += 1;
          const sup = this.parseNode();
          return builders.subsup(
            sub.type === 'row' ? sub.children : [sub],
            sup.type === 'row' ? sup.children : [sup],
          );
        }
        return builders.subsup(sub.type === 'row' ? sub.children : [sub]);
      }
      case '^': {
        this.consume(); // '^'
        const sup = this.parseNode();
        return builders.subsup(
          undefined,
          sup.type === 'row' ? sup.children : [sup],
        );
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
      default: {
        this.consume();
        return builders.char(char);
      }
    }
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

  // TODO: return the terminator that was used to end the row if there was one
  parseRow(
    terminators: readonly ('&' | '\\' | '}' | ']' | 'right' | 'end')[] = [],
  ): [types.CharRow, string | undefined] {
    const nodes: types.CharNode[] = [];
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

      if (isTerminator(char) && terminators.includes(char)) {
        this.consume(); // terminator
        return [builders.row(nodes), char];
      }

      nodes.push(this.parseNode());
    }
    return [builders.row(nodes), undefined];
  }
}

const matrixTypes = ['bmatrix', 'pmatrix'];

const isTerminator = (
  name: string,
): name is '&' | '\\' | '}' | ']' | 'right' | 'end' =>
  ['&', '\\', '}', ']', 'right', 'end'].includes(name);

export const parse = (input: string): types.CharRow => {
  const parser = new Parser(input);
  return parser.parse();
};
