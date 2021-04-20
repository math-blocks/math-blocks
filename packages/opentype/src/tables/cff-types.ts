export type TopDict = {
    version?: string;
    Notice?: string;
    Copyright?: string;
    FullName?: string;
    FamilyName?: string;
    Weight?: string;
    isFixedPitch: boolean; // default: false
    ItalicAngle: number; // default: 0
    UnderlinePosition: number; // default: -100
    UnderlineThickness: number; // default: 5
    PaintType: number; // default: 0
    CharstringType: number; // default: 2
    fontMatrix: number[]; // default: 0.001, 0, 0, 0.001, 0, 0
    UniqueID?: number;
    FontBBox: number[]; // default: [0, 0, 0, 0]; [xMin, yMin, xMax, yMax]
    StrokeWidth: number; // default: 0
    XUID?: number[];
    charset: number; // default: 0, charset offset (0)
    Encoding: number; // default: 0, encoding offset (0)
    CharStrings?: number;
    Private?: [number, number]; // private DICT size and offset (0)
    SyntheticBase?: number;
    PostScript?: string; // notes: embedded PostScript language code
    BaseFontName?: string;
    BaseFontBlend?: number;

    // Private DICT values
    BlueValues?: number[]; // delta: encoded
    OtherBlues?: number[]; // delta: encoded
    FamilyBlues?: number[]; // delta: encoded
    FamilyOtherBlues?: number[]; // delta encoded
    BlueScale: number; // default: 0.039625
    BlueShift: number; // default: 7
    BlueFuzz: number; // default: 1
    StdHW?: number;
    StdVW?: number;
    StemSnapH?: number[]; // delta encoded
    StemSnapV?: number[]; // delta encoded
    ForceBold: boolean; // default: false
    LanguageGroup: number; // default: 0
    ExpansionFactor: number; // default: 0.06
    initialRandomSee: number; // default: 0
    Subrs?: number;

    // If the char width matches the defaultWidthX, it can be omitted.
    defaultWidthX: number; // default: 0

    // If not, then the char width is the charstring width plus nominalWidthX.
    nominalWidthX: number; // default: 0
};

export type Command =
    | {
          type: "M";
          x: number;
          y: number;
      }
    | {
          type: "L";
          x: number;
          y: number;
      }
    | {
          type: "Q";
          x1: number;
          y1: number;
          x: number;
          y: number;
      }
    | {
          type: "C";
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          x: number;
          y: number;
      }
    | {
          type: "Z";
      };

export type Path = Command[];

export type GlyphData = {
    path: Path;
    advanceWidth: number;
};

type Metrics = {
    advance: number;
};

export type Glyph = {
    path: Path;
    metrics: Metrics;
    name: string;
};
