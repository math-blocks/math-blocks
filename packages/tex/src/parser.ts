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
    return this.parseRow();
  }

  parseNode(): types.CharNode {
    const char = this.peek();

    switch (char) {
      case '{': {
        this.consume(); // '{'
        return this.parseRow('}');
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
          index = this.parseRow(']');
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
        const inner = this.parseRow('right');
        const rightDelim = this.rightDelims.pop();
        if (!rightDelim) {
          throw new Error('no right delimiter');
        }
        return builders.delimited(
          inner.children,
          builders.char(leftDelim),
          builders.char(rightDelim),
        );
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

  parseRow(terminator?: '}' | ']' | 'right'): types.CharRow {
    const nodes: types.CharNode[] = [];
    while (this.index < this.input.length) {
      const char = this.input[this.index];
      if (terminator === char) {
        this.consume(); // '}'
        break;
      }
      if (char === '\\') {
        const oldIndex = this.index;
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
        if (terminator === name) {
          // TODO: check if it's a valid delimiter
          this.input[this.index];
          this.rightDelims.push(this.input[this.index]);
          this.consume(); // right delimiter
          break;
        } else {
          this.index = oldIndex;
        }
      }
      nodes.push(this.parseNode());
    }
    return builders.row(nodes);
  }
}

export const parse = (input: string): types.CharRow => {
  const parser = new Parser(input);
  return parser.parse();
};
