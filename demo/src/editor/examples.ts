import { builders, AccentType } from '@math-blocks/editor';

const simpleRow = builders.row([
  builders.char('2'),
  builders.char('x'),
  builders.char('+'),
  builders.char('5'),
  builders.char('='),
  builders.char('1'),
  builders.char('0'),
]);

const quadraticEquation = builders.row([
  builders.char('x'),
  builders.char('='),
  builders.frac(
    [
      builders.char('\u2212'),
      builders.char('b'),
      builders.char('\u00B1'),
      builders.root(null, [
        builders.char('b'),
        builders.subsup(undefined, [builders.char('2')]),
        builders.char('\u2212'),
        builders.char('4'),
        builders.char('a'),
        builders.char('c'),
      ]),
    ],
    [builders.char('2'), builders.char('a')],
  ),
]);

const delimiters = builders.row([
  builders.char('x'),
  builders.char('+'),
  builders.delimited(
    [
      builders.frac(
        [builders.char('y'), builders.char('\u2212'), builders.char('1')],
        [builders.char('x')],
      ),
    ],
    builders.char('('),
    builders.char(')'),
  ),
  builders.subsup([builders.char('n')], [builders.char('2')]),
  builders.char('+'),
  builders.char('z'),
]);

const allNodeTypes = builders.row([
  builders.char('2'),
  builders.char('+'),
  builders.frac(
    [builders.char('1')],
    [
      builders.root(
        [builders.char('1'), builders.char('2'), builders.char('3')],
        [
          builders.char('x'),
          builders.subsup(undefined, [builders.char('2')]),
          builders.char('+'),
          builders.frac(
            [builders.char('1')],
            [
              builders.char('a'),
              builders.subsup([builders.char('n')], undefined),
            ],
          ),
        ],
      ),
    ],
  ),
  builders.char('\u2212'),
  builders.char('\u2212'),
  builders.char('y'),
  builders.char('+'),
  builders.limits(
    builders.row([builders.char('l'), builders.char('i'), builders.char('m')]),
    [
      builders.char('x'),
      builders.char('\u2192'), // \rightarrow
      builders.char('0'),
    ],
  ),
  builders.char('x'),
  builders.char('+'),
  builders.limits(
    builders.char('\u2211'), // \sum
    [builders.char('i'), builders.char('='), builders.char('0')],
    [builders.char('\u221E')], // \infty
  ),
  builders.char('i'),
]);

const nestedFractions = builders.row([
  builders.char('a'),
  builders.char('+'),
  builders.frac(
    [
      builders.char('2'),
      builders.char('+'),
      builders.frac(
        [builders.char('x'), builders.char('+'), builders.char('1')],
        [builders.char('1')],
      ),
      builders.char('+'),
      builders.char('\u2212'),
      builders.char('y'),
    ],
    [builders.char('1')],
  ),
  builders.char('+'),
  builders.char('b'),
]);

const addingFractions = builders.row([
  builders.char('2'),
  builders.char('+'),
  builders.frac(
    [
      builders.frac([builders.char('a')], [builders.char('b')]),
      builders.char('+'),
      builders.frac([builders.char('c')], [builders.char('d')]),
    ],
    [builders.char('1')],
  ),
  builders.char('+'),
  builders.frac(
    [
      builders.frac([builders.char('x')], [builders.char('y')]),
      builders.char('+'),
      builders.char('1'),
    ],
    [builders.char('1')],
  ),
  builders.char('\u2212'),
  builders.char('y'),
]);

// @ts-expect-error: ignore readonly
addingFractions.children[2].style.color = 'teal';
// @ts-expect-error: we don't both refining the type since we know what it is
addingFractions.children[2].children[0].style.color = 'orange';
// @ts-expect-error: we don't both refining the type since we know what it is
addingFractions.children[2].children[0].children[0].style.color = 'pink';

const matrix = builders.row([
  builders.char('A'),
  builders.char('='),
  builders.matrix(
    [
      // first row
      [builders.char('a')],
      [builders.char('b')],
      [builders.char('c')],

      // second row
      [builders.char('d')],
      [builders.char('e'), builders.char('+'), builders.char('1')],
      [builders.char('f')],

      // third row
      [builders.char('0')],
      [builders.char('0')],
      [builders.char('1')],
    ],
    3,
    3,
    {
      left: builders.char('['),
      right: builders.char(']'),
    },
  ),
]);

const subsups = builders.row([
  builders.char('x'),
  builders.subsup([builders.char('n')], undefined),
  builders.char('x'),
  builders.subsup(undefined, [builders.char('2')]),
  builders.char('x'),
  builders.subsup(
    [builders.char('n'), builders.char('t')],
    [builders.char('2'), builders.char('j')],
  ),
  builders.char('x'),
  builders.subsup(
    [builders.char('n'), builders.subsup(undefined, [builders.char('t')])],
    [builders.char('2'), builders.subsup([builders.char('j')], undefined)],
  ),
]);

const integral = builders.row([
  builders.limits(
    builders.char('\u222B'), // \sum
    [builders.char('0')],
    [builders.char('1')], // \infty
  ),
  builders.frac([builders.char('1')], [builders.char('x')]),
  builders.char('d'),
  builders.char('x'),
]);

const accents = builders.row([
  builders.accent(
    [builders.char('a'), builders.char('b'), builders.char('c')],
    AccentType.Hat,
  ),
  builders.char('='),
  builders.accent([builders.char('i')], AccentType.Vec),
  builders.char('+'),
  builders.accent([builders.char('j')], AccentType.Vec),
  builders.char('+'),
  builders.accent([builders.char('k')], AccentType.Vec),
]);

export const examples = [
  simpleRow,
  quadraticEquation,
  addingFractions,
  allNodeTypes,
  delimiters,
  nestedFractions,
  matrix,
  subsups,
  integral,
  accents,
];
