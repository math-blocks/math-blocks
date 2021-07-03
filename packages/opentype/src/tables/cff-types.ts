export type TopDict = {
    readonly version?: string;
    readonly Notice?: string;
    readonly Copyright?: string;
    readonly FullName?: string;
    readonly FamilyName?: string;
    readonly Weight?: string;
    readonly isFixedPitch: boolean; // default: false
    readonly ItalicAngle: number; // default: 0
    readonly UnderlinePosition: number; // default: -100
    readonly UnderlineThickness: number; // default: 5
    readonly PaintType: number; // default: 0
    readonly CharstringType: number; // default: 2
    readonly fontMatrix: readonly number[]; // default: 0.001, 0, 0, 0.001, 0, 0
    readonly UniqueID?: number;
    readonly FontBBox: readonly number[]; // default: [0, 0, 0, 0]; [xMin, yMin, xMax, yMax]
    readonly StrokeWidth: number; // default: 0
    readonly XUID?: readonly number[];
    readonly charset: number; // default: 0, charset offset (0)
    readonly Encoding: number; // default: 0, encoding offset (0)
    readonly CharStrings?: number;
    readonly Private?: readonly [number, number]; // private DICT size and offset (0)
    readonly SyntheticBase?: number;
    readonly PostScript?: string; // notes: embedded PostScript language code
    readonly BaseFontName?: string;
    readonly BaseFontBlend?: number;

    // Private DICT values
    readonly BlueValues?: readonly number[]; // delta: encoded
    readonly OtherBlues?: readonly number[]; // delta: encoded
    readonly FamilyBlues?: readonly number[]; // delta: encoded
    readonly FamilyOtherBlues?: readonly number[]; // delta encoded
    readonly BlueScale: number; // default: 0.039625
    readonly BlueShift: number; // default: 7
    readonly BlueFuzz: number; // default: 1
    readonly StdHW?: number;
    readonly StdVW?: number;
    readonly StemSnapH?: readonly number[]; // delta encoded
    readonly StemSnapV?: readonly number[]; // delta encoded
    readonly ForceBold: boolean; // default: false
    readonly LanguageGroup: number; // default: 0
    readonly ExpansionFactor: number; // default: 0.06
    readonly initialRandomSee: number; // default: 0
    readonly Subrs?: number;

    // If the char width matches the defaultWidthX, it can be omitted.
    readonly defaultWidthX: number; // default: 0

    // If not, then the char width is the charstring width plus nominalWidthX.
    readonly nominalWidthX: number; // default: 0
};

export type Command =
    | {
          readonly type: "M";
          readonly x: number;
          readonly y: number;
      }
    | {
          readonly type: "L";
          readonly x: number;
          readonly y: number;
      }
    | {
          readonly type: "Q";
          readonly x1: number;
          readonly y1: number;
          readonly x: number;
          readonly y: number;
      }
    | {
          readonly type: "C";
          readonly x1: number;
          readonly y1: number;
          readonly x2: number;
          readonly y2: number;
          readonly x: number;
          readonly y: number;
      }
    | {
          readonly type: "Z";
      };

export type Path = readonly Command[];

export type GlyphData = {
    readonly path: Path;
    readonly advanceWidth: number;
};

type Metrics = {
    readonly advance: number;
};

export type Glyph = {
    readonly path: Path;
    readonly metrics: Metrics;
    readonly name: string;
};
