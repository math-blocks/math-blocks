import { MathStyle, RenderMode, RadicalDegreeAlgorithm } from './enums';

import type { Selection } from '@math-blocks/editor';
import type { FontData } from '@math-blocks/opentype';

export type Context = {
  readonly fontData: FontData;
  readonly baseFontSize: number;
  readonly mathStyle: MathStyle;
  readonly cramped: boolean;
  // TODO: Create a helper function to add colors to nodes in an Editor tree
  // colorMap?: Map<number, string>;
  readonly operator?: boolean; // if true, doesn't use italics for latin glyphs
  readonly macro?: boolean; // if true, glyphs are rendered upright
  readonly operators: readonly string[]; // named operators, e.g. sin, cos, etc.
  readonly renderMode: RenderMode;
  readonly radicalDegreeAlgorithm?: RadicalDegreeAlgorithm;
  readonly selection?: Selection;
};

export type Dist = number;

export type Dim = Readonly<{
  readonly width: Dist;
  readonly depth: Dist;
  readonly height: Dist;
}>;

type Style = {
  readonly color?: string;
  readonly cancel?: number; // The ID of the cancel notation
};

type Common = {
  readonly id?: number;
  readonly style: Style;
};

export type Content =
  | {
      readonly type: 'static';
      readonly nodes: readonly Node[];
    }
  | {
      readonly type: 'cursor';
      readonly left: readonly Node[];
      readonly right: readonly Node[];
    }
  | {
      readonly type: 'selection';
      readonly left: readonly Node[];
      readonly selection: readonly Node[];
      readonly right: readonly Node[];
    };

export type HBox = {
  readonly type: 'HBox';
  readonly shift: Dist;
  readonly content: Content;
  readonly fontSize: number;
} & Common &
  Dim;

export type VBox = {
  readonly type: 'VBox';
  readonly shift: Dist;
  readonly content: readonly Node[];
  readonly fontSize: number;
} & Common &
  Dim;

export type Glyph = {
  readonly type: 'Glyph';
  readonly char?: string;
  readonly glyphID: number; // This is specific to the Font in FontData
  readonly size: number;
  readonly fontData: FontData;
  readonly pending?: boolean;
  readonly isDelimiter: boolean;
} & Common;

export type Kern = {
  readonly type: 'Kern';
  readonly size: Dist;
  // Used for hitboxes at the start/end of a numerator or denominator
  readonly flag?: 'start' | 'end';
} & Common;

export type HRule = {
  readonly type: 'HRule';
  readonly thickness: number;
  readonly width: number;
} & Common;

export type Node = HBox | VBox | Glyph | Kern | HRule;

export type Side = 'left' | 'right'; // TODO: make this a real enum
export type Intersection =
  | { readonly type: 'content'; readonly id: number; readonly side: Side }
  | { readonly type: 'padding'; readonly flag: 'start' | 'end' };
