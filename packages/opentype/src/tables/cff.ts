import type { Mutable } from 'utility-types';

import { STANDARD_STRINGS } from './cff-standard-strings';

import type { Glyph, GlyphData, Command, TopDict } from './cff-types';

// TODO: handle parsing operands that are real numbers
// Thus, the value –2.25 is encoded by the byte sequence (1e e2 a2 5f) and the
// value 0.140541E–3 by the sequence (1e 0a 14 05 41 c3 ff).

type Index = {
  readonly count: number; // Card16 (uint16)
  readonly offSize: number; // OffSize (1 - 4)
  readonly offsets: readonly number[]; // length = count + 1
  readonly data: Uint8Array;
};

const parseIndex = async (
  blob: Blob,
  offset: number,
): Promise<[Index, number]> => {
  let buffer = await blob.slice(offset, offset + 3).arrayBuffer();
  let view = new DataView(buffer);

  const count = view.getUint16(0);
  const offSize = view.getUint8(2);

  buffer = await blob
    .slice(offset + 3, offset + 3 + (count + 1) * offSize)
    .arrayBuffer();
  view = new DataView(buffer);

  const offsets: number[] = [];
  for (let i = 0; i < count + 1; i += 1) {
    let value = 0;
    for (let j = 0; j < offSize; j += 1) {
      value = value << 8;
      value += view.getUint8(offSize * i + j);
    }
    offsets.push(value);
  }

  const nameIndex: Index = {
    count: count,
    offSize: offSize,
    offsets: offsets,
    // TODO: make this an array of Uint8Arrays, one for each item in the index
    data: new Uint8Array(
      await blob
        .slice(
          offset + 3 + offsets.length * offSize,
          offset +
            3 +
            offsets.length * offSize +
            offsets[offsets.length - 1] -
            1,
        )
        .arrayBuffer(),
    ),
  };

  // offsets are 1-indexed so we ahve to subtract one from the value of the
  // last offset.
  const size = 3 + offsets.length * offSize + offsets[offsets.length - 1] - 1;

  return [nameIndex, size];
};

const topDictDefaults: TopDict = {
  isFixedPitch: false,
  ItalicAngle: 0,
  UnderlinePosition: -100,
  UnderlineThickness: 50,
  PaintType: 0,
  CharstringType: 2,
  fontMatrix: [0.001, 0, 0, 0.001, 0, 0],
  FontBBox: [0, 0, 0, 0],
  StrokeWidth: 0,
  charset: 0,
  Encoding: 0,

  // Private DICT values
  BlueScale: 0.039625,
  BlueShift: 7,
  BlueFuzz: 1,
  ForceBold: false,
  LanguageGroup: 0,
  ExpansionFactor: 0.06,
  initialRandomSee: 0,
  defaultWidthX: 0,
  nominalWidthX: 0,
};

let decoder: TextDecoder | null = null;

const getString = (operand: number, stringIndex: Index): string => {
  if (operand < 391) {
    return STANDARD_STRINGS[operand];
  }

  const { offsets, data } = stringIndex;

  const index = operand - 391;
  const start = offsets[index] - 1;
  const end = offsets[index + 1] - 1;

  if (decoder === null) {
    decoder = new TextDecoder();
  }

  return decoder.decode(data.slice(start, end));
};

const parseTopDictData = (
  data: Uint8Array,
  dict: Mutable<TopDict>,
  stringIndex: Index,
): void => {
  const stack: number[] = [];

  let i = 0;

  const getOperand = (): number => {
    const operand = stack.pop();
    if (typeof operand === 'undefined') {
      throw new Error('missing operand');
    }
    return operand;
  };

  const parseFloatOperand = (): number => {
    let s = '';
    const eof = 15;
    const lookup = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '.',
      'E',
      'E-',
      null,
      '-',
    ];
    // eslint-disable-next-line
    while (true) {
      const b = data[i++];
      const n1 = b >> 4;
      const n2 = b & 15;

      if (n1 === eof) {
        break;
      }

      s += lookup[n1];

      if (n2 === eof) {
        break;
      }

      s += lookup[n2];
    }

    return parseFloat(s);
  };

  // TODO: compute actual values from delta encoding
  const getDelta = (): number[] => {
    const delta = [...stack];
    stack.length = 0;
    return delta;
  };

  while (i < data.length) {
    const b0 = data[i++];

    if (b0 <= 21) {
      if (b0 === 0) {
        dict.version = getString(getOperand(), stringIndex);
      } else if (b0 === 1) {
        dict.Notice = getString(getOperand(), stringIndex);
      } else if (b0 === 2) {
        dict.FullName = getString(getOperand(), stringIndex);
      } else if (b0 === 3) {
        dict.FamilyName = getString(getOperand(), stringIndex);
      } else if (b0 === 4) {
        dict.Weight = getString(getOperand(), stringIndex);
      } else if (b0 === 5) {
        // Reverse the array since getOperand() returns operands in
        // reverse order.
        const array = [getOperand(), getOperand(), getOperand(), getOperand()];
        array.reverse();
        dict.FontBBox = array;
      } else if (b0 === 6) {
        dict.BlueValues = getDelta();
      } else if (b0 === 7) {
        dict.OtherBlues = getDelta();
      } else if (b0 === 8) {
        dict.FamilyBlues = getDelta();
      } else if (b0 === 9) {
        dict.FamilyOtherBlues = getDelta();
      } else if (b0 === 10) {
        dict.StdHW = getOperand();
      } else if (b0 === 11) {
        dict.StdVW = getOperand();
      } else if (b0 === 12) {
        const b1 = data[i++];
        if (b1 === 0) {
          dict.Copyright = getString(getOperand(), stringIndex);
        } else if (b1 === 1) {
          dict.isFixedPitch = Boolean(getOperand());
        } else if (b1 === 2) {
          dict.ItalicAngle = getOperand();
        } else if (b1 === 3) {
          dict.UnderlinePosition = getOperand();
        } else if (b1 === 4) {
          dict.UnderlineThickness = getOperand();
        } else if (b1 === 5) {
          dict.PaintType = getOperand();
        } else if (b1 === 6) {
          dict.CharstringType = getOperand();
        } else if (b1 === 7) {
          const array = [
            getOperand(),
            getOperand(),
            getOperand(),
            getOperand(),
            getOperand(),
            getOperand(),
          ];
          // Reverse the array since getOperand() returns operands in
          // reverse order.
          array.reverse();
          dict.fontMatrix = array;
        } else if (b1 === 8) {
          dict.StrokeWidth = getOperand();
        } else if (b1 === 9) {
          dict.BlueScale = getOperand();
        } else if (b1 === 10) {
          dict.BlueShift = getOperand();
        } else if (b1 === 11) {
          dict.BlueFuzz = getOperand();
        } else if (b1 === 12) {
          dict.StemSnapH = getDelta();
        } else if (b1 === 13) {
          dict.StemSnapV = getDelta();
        } else if (b1 === 14) {
          dict.ForceBold = Boolean(getOperand());
        } else if (b1 === 17) {
          dict.LanguageGroup = getOperand();
        } else if (b1 === 18) {
          dict.ExpansionFactor = getOperand();
        } else if (b1 === 19) {
          dict.initialRandomSee = getOperand();
        } else if (b1 === 20) {
          dict.SyntheticBase = getOperand();
        } else if (b1 === 21) {
          dict.PostScript = getString(getOperand(), stringIndex);
        } else if (b1 === 22) {
          dict.BaseFontName = getString(getOperand(), stringIndex);
        } else if (b1 === 23) {
          dict.BaseFontBlend = getOperand();
        } else {
          throw new Error(`Unexpected operator ${b0} ${b1}`);
        }
      } else if (b0 === 13) {
        dict.UniqueID = getOperand();
      } else if (b0 === 14) {
        const XUID = [...stack];
        stack.length = 0;
        dict.XUID = XUID;
      } else if (b0 === 15) {
        dict.charset = getOperand();
      } else if (b0 === 16) {
        dict.Encoding = getOperand();
      } else if (b0 === 17) {
        dict.CharStrings = getOperand();
      } else if (b0 === 18) {
        dict.Private = [getOperand(), getOperand()];
      } else if (b0 === 19) {
        dict.Subrs = getOperand();
      } else if (b0 === 20) {
        dict.defaultWidthX = getOperand();
      } else if (b0 === 21) {
        dict.nominalWidthX = getOperand();
      } else {
        throw new Error(`Unexpected operator ${b0}`);
      }
    }

    if (b0 >= 32 && b0 <= 246) {
      stack.push(b0 - 139);
    } else if (b0 >= 247 && b0 <= 250) {
      const b1 = data[i++];
      stack.push((b0 - 247) * 256 + b1 + 108);
    } else if (b0 >= 251 && b0 <= 254) {
      const b1 = data[i++];
      stack.push(-(b0 - 251) * 256 - b1 - 108);
    } else if (b0 === 28) {
      const b1 = data[i++];
      const b2 = data[i++];
      stack.push((b1 << 8) | b2);
    } else if (b0 === 29) {
      const b1 = data[i++];
      const b2 = data[i++];
      const b3 = data[i++];
      const b4 = data[i++];
      stack.push((b1 << 24) | (b2 << 16) | (b3 << 8) | b4);
    } else if (b0 === 30) {
      stack.push(parseFloatOperand());
    }

    // b0 is reserved, throw an error? ignore?
  }
};

const parseCharstring = (
  data: Uint8Array,
  topDict: TopDict,
  getSubrs: (index: number) => Uint8Array | null,
): GlyphData => {
  const stack: number[] = [];

  let x = 0;
  let y = 0;

  let width = topDict.defaultWidthX;
  let hasWidth = false;
  let nStems = 0;

  const path: Command[] = [];

  let open = false;
  const newContour = (x: number, y: number): void => {
    if (open) {
      path.push({ type: 'Z' });
    }

    path.push({ type: 'M', x, y });
    open = true;
  };

  const shift = (): number => {
    const value = stack.shift();
    if (typeof value === 'undefined') {
      throw new Error('Not enough operands');
    }
    return value;
  };

  // TODO: actually parse the stem data, right now we just grab the number
  // of stems and clear the stack.
  const parseStems = (): void => {
    // The number of stem operators on the stack is always even.
    // If the value is uneven, that means a width is specified.
    const hasWidthArg = stack.length % 2 !== 0;
    if (hasWidthArg && !hasWidth) {
      width = shift() + topDict.nominalWidthX;
    }

    nStems += stack.length >> 1;
    stack.length = 0;
    hasWidth = true;
  };

  const parse = (data: Uint8Array): void => {
    let i = 0;

    while (i < data.length) {
      /**
       * Notes:
       * - "|-" at the start indicates that the operator grabs arguments
       *   from the bottom of the stack using shift().
       * - "|-" at the end indicates that the operator clears argument stack.
       */

      const b0 = data[i++];

      switch (b0) {
        /**
         * Path Constructor Operators
         */

        // rmoveto: dx1 dy1 rmoveto (21)
        case 21: {
          if (stack.length > 2 && !hasWidth) {
            width = shift() + topDict.nominalWidthX;
            hasWidth = true;
          }

          const dx1 = shift();
          const dy1 = shift();

          x += dx1;
          y += dy1;

          newContour(x, y);

          break;
        }

        // hmoveto: dx1 hmoveto (22)
        case 22: {
          if (stack.length > 1 && !hasWidth) {
            width = shift() + topDict.nominalWidthX;
            hasWidth = true;
          }

          const dx1 = shift();

          x += dx1;
          newContour(x, y);
          break;
        }

        // vmoveto: |- dy1 vmoveto (4) |-
        case 4: {
          if (stack.length > 1 && !hasWidth) {
            width = shift() + topDict.nominalWidthX;
            hasWidth = true;
          }

          const dy1 = shift();

          y += dy1;

          newContour(x, y);
          break;
        }

        // rlineto: |- {dxa dya}+ rlineto (5) |-
        case 5: {
          while (stack.length > 0) {
            x += shift();
            y += shift();
            path.push({ type: 'L', x, y });
          }
          break;
        }

        // hlineto: |- dx1 {dya dxb}* hlineto (6) |-
        //          |- {dxa dyb}+ hlineto (6) |-
        case 6: {
          while (stack.length > 0) {
            x += shift();
            path.push({ type: 'L', x, y });
            if (stack.length === 0) {
              break;
            }
            y += shift();
            path.push({ type: 'L', x, y });
          }
          break;
        }

        // vlineto: |- dy1 {dxa dyb}* vlineto (7) |-
        //          |- {dya dxb}+ vlineto (7) |-
        case 7: {
          while (stack.length > 0) {
            y += shift();
            path.push({ type: 'L', x, y });
            if (stack.length === 0) {
              break;
            }
            x += shift();
            path.push({ type: 'L', x, y });
          }
          break;
        }

        // rrcurveto: {dxa dya dxb dyb dxc dyc}+ rrcurveto (8)
        case 8: {
          while (stack.length > 0) {
            const dxa = shift();
            const dya = shift();
            const dxb = shift();
            const dyb = shift();
            const dxc = shift();
            const dyc = shift();

            const x1 = x + dxa;
            const y1 = y + dya;
            const x2 = x1 + dxb;
            const y2 = y1 + dyb;
            x = x2 + dxc;
            y = y2 + dyc;

            path.push({ type: 'C', x1, y1, x2, y2, x, y });
          }
          break;
        }

        // hhcurveto: dy1? {dxa dxb dyb dxc}+ hhcurveto (27)
        case 27: {
          if (stack.length % 2) {
            const dy1 = shift();
            y += dy1;
          }

          while (stack.length > 0) {
            const dxa = shift();
            const dxb = shift();
            const dyb = shift();
            const dxc = shift();

            const x1 = x + dxa;
            const y1 = y;
            const x2 = x1 + dxb;
            const y2 = y1 + dyb;
            x = x2 + dxc;
            y = y2;

            path.push({ type: 'C', x1, y1, x2, y2, x, y });
          }

          break;
        }

        // hvcurveto: dx1 dx2 dy2 dy3 {dya dxb dyb dxc dxd dxe dye dyf}* dxf? hcurveto (31)
        //            {dxa dxb dyb dyc dyd dxe dye dxf}+ dyf? hcurveto (31)
        case 31: {
          let x1, y1, x2, y2;

          while (stack.length > 0) {
            const dxa = shift();
            const dxb = shift();
            const dyb = shift();
            const dyc = shift();
            const dxLast = stack.length === 1 ? shift() : 0;

            x1 = x + dxa;
            y1 = y;
            x2 = x1 + dxb;
            y2 = y1 + dyb;
            x = x2 + dxLast;
            y = y2 + dyc;

            path.push({ type: 'C', x1, y1, x2, y2, x, y });

            if (stack.length === 0) {
              break;
            }

            const dyd = shift();
            const dxe = shift();
            const dye = shift();
            const dxf = shift();
            const dyLast = stack.length === 1 ? shift() : 0;

            x1 = x;
            y1 = y + dyd;
            x2 = x1 + dxe;
            y2 = y1 + dye;
            x = x2 + dxf;
            y = y2 + dyLast;

            path.push({ type: 'C', x1, y1, x2, y2, x, y });
          }

          break;
        }

        // rcurveline: {dxa dya dxb dyb dxc dyc}+ dxd dyd rcurveline (24)
        case 24: {
          while (stack.length > 2) {
            const dxa = shift();
            const dya = shift();
            const dxb = shift();
            const dyb = shift();
            const dxc = shift();
            const dyc = shift();

            const x1 = x + dxa;
            const y1 = y + dya;
            const x2 = x1 + dxb;
            const y2 = y1 + dyb;
            x = x2 + dxc;
            y = y2 + dyc;

            path.push({ type: 'C', x1, y1, x2, y2, x, y });
          }

          const dxd = shift();
          const dyd = shift();

          x += dxd;
          y += dyd;

          path.push({ type: 'L', x, y });

          break;
        }

        // rlinecurve: {dxa dya}+ dxb dyb dxc dyc dxd dyd rlinecurve (25)
        case 25: {
          while (stack.length > 6) {
            const dxa = shift();
            const dya = shift();

            x += dxa;
            y += dya;

            path.push({ type: 'L', x, y });
          }

          const dxb = shift();
          const dyb = shift();
          const dxc = shift();
          const dyc = shift();
          const dxd = shift();
          const dyd = shift();

          const x1 = x + dxb;
          const y1 = y + dyb;
          const x2 = x1 + dxc;
          const y2 = y1 + dyc;
          x = x2 + dxd;
          y = y2 + dyd;

          path.push({ type: 'C', x1, y1, x2, y2, x, y });

          break;
        }

        // vhcurveto: dy1 dx2 dy2 dx3 {dxa dxb dyb dyc dyd dxe dye dxf}* dyf? vhcurveto (30)
        //            {dya dxb dyb dxc dxd dxe dye dyf}+ dxf? vhcurveto (30)
        case 30: {
          let x1, y1, x2, y2;

          while (stack.length > 0) {
            const dya = shift();
            const dxb = shift();
            const dyb = shift();
            const dxc = shift();
            const dyLast = stack.length === 1 ? shift() : 0;

            x1 = x;
            y1 = y + dya;
            x2 = x1 + dxb;
            y2 = y1 + dyb;
            x = x2 + dxc;
            y = y2 + dyLast;

            path.push({ type: 'C', x1, y1, x2, y2, x, y });

            if (stack.length === 0) {
              break;
            }

            const dxd = shift();
            const dxe = shift();
            const dye = shift();
            const dyf = shift();
            const dxLast = stack.length === 1 ? shift() : 0;

            x1 = x + dxd;
            y1 = y;
            x2 = x1 + dxe;
            y2 = y1 + dye;
            x = x2 + dxLast;
            y = y2 + dyf;

            path.push({ type: 'C', x1, y1, x2, y2, x, y });
          }

          break;
        }

        // vvcurveto: dx1? {dya dxb dyb dyc}+ vvcurveto (26)
        case 26: {
          if (stack.length % 2) {
            const dx1 = shift();
            x += dx1;
          }

          while (stack.length > 0) {
            const dya = shift();
            const dxb = shift();
            const dyb = shift();
            const dyc = shift();

            const x1 = x;
            const y1 = y + dya;
            const x2 = x1 + dxb;
            const y2 = y1 + dyb;
            x = x2;
            y = y2 + dyc;

            path.push({ type: 'C', x1, y1, x2, y2, x, y });
          }

          break;
        }

        case 12: {
          const b1 = data[i++];

          switch (b1) {
            // // flex: dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 dx6 dy6 fd flex (12 35)
            // case 35: {
            //     break;
            // }

            // // hflex: dx1 dx2 dy2 dx3 dx4 dx5 dx6 hflex (12 34)
            // case 34: {
            //     break;
            // }

            // // hflex1: dx1 dy1 dx2 dy2 dx3 dx4 dx5 dy5 dx6 hflex1 (12 36)
            // case 36: {
            //     break;
            // }

            // // flex1: dx1 dy1 dx2 dy2 dy3 dx4 dy4 dx5 dy5 d6 flex1 (12 37)
            // case 37: {
            //     break;
            // }

            default: {
              throw new Error(`Unrecognized operator: 12 ${b1}`);
            }
          }

          break;
        }

        // endchar: endchar (14)
        case 14: {
          if (stack.length > 0 && !hasWidth) {
            width = shift() + topDict.nominalWidthX;
            hasWidth = true;
          }

          if (open) {
            path.push({ type: 'Z' });
            open = false;
          }

          break;
        }

        /**
         * Hint Operators
         */

        // hstem: y dy {dya dyb}* hstem (1)
        case 1: {
          parseStems();
          break;
        }

        // vstem: x dx {dxa dxb}* vstem (3)
        case 3: {
          parseStems();
          break;
        }

        // hstemhm: y dy {dya dyb}* hstemhm (18)
        case 18: {
          parseStems();
          break;
        }

        // vstemhm: x dx {dxa dxb}* vstemhm (23)
        case 23: {
          parseStems();
          break;
        }

        // hintmask: hintmask (19 + mask)
        case 19: {
          parseStems();
          i += (nStems + 7) >> 3;
          break;
        }

        // cntrmask: cntrmask (20 + mask)
        case 20: {
          parseStems();
          i += (nStems + 7) >> 3;
          break;
        }

        /**
         * Arithmetic Operators
         */

        // TODO

        /**
         * Subroutine Operators
         */

        // callsubr: subr# callsubr (10) -
        case 10: {
          const subr = shift();
          const data = getSubrs(subr);

          if (!data) {
            throw new Error(`no data for subr = ${subr}`);
          }

          parse(data);
          break;
        }

        // return: - return (11) -
        case 11: {
          return;
        }

        /**
         * Operands
         */

        default: {
          if (b0 >= 32 && b0 <= 246) {
            stack.push(b0 - 139);
          } else if (b0 >= 247 && b0 <= 250) {
            const b1 = data[i++];
            stack.push((b0 - 247) * 256 + b1 + 108);
          } else if (b0 >= 251 && b0 <= 254) {
            const b1 = data[i++];
            stack.push(-((b0 - 251) * 256) - b1 - 108);
          } else if (b0 === 255) {
            const b1 = data[i++];
            const b2 = data[i++];
            const b3 = data[i++];
            const b4 = data[i++];
            stack.push(((b1 << 24) | (b2 << 16) | (b3 << 8) | b4) / 65536);
          } else if (b0 === 28) {
            const b1 = data[i++];
            const b2 = data[i++];
            stack.push(((b1 << 24) | (b2 << 16)) >> 16);
          } else {
            throw new Error(`Unrecognized operator: ${b0}`);
          }
        }
      }
    }
  };

  parse(data);

  const glyphData: GlyphData = {
    path,
    advanceWidth: width,
  };

  return glyphData;
};

const parseCharset = async (
  blob: Blob,
  topDict: TopDict,
  nGlyphs: number,
): Promise<Record<number, number>> => {
  // NOTE: We grab all of the data here until the start of CharStrings.  If
  // FDSelect (optional) is present then the slice will also include FDSelect.
  // This is okay, since we use the `count` property from the CharStrings index
  // to know how many glyphs are available to be parsed.
  const charsetData = await blob
    .slice(topDict.charset, topDict.CharStrings)
    .arrayBuffer();

  const view = new DataView(charsetData);
  const format = view.getUint8(0);

  // Charset is a mapping between GID and SID.  The SID can then be used to
  // get the name of a glyph.
  const charset: Record<number, number> = {};

  if (format === 0) {
    let gid = 1;
    let i = 1;
    while (gid < nGlyphs) {
      const sid = view.getUint16(i);
      charset[gid] = sid;
      i += 2;
      gid += 1;
    }
  } else if (format === 1) {
    throw new Error("Can't parse charset format 1 yet");
  } else if (format === 2) {
    let gid = 1;
    let i = 1;
    while (gid < nGlyphs) {
      const first = view.getUint16(i);
      const nLeft = view.getUint16(i + 2);
      i += 4;

      for (let j = 0; j <= nLeft; j++) {
        const sid = first + j;
        charset[gid] = sid;
        gid += 1;
      }
    }
  } else {
    throw new Error(`Unrecognized charset format ${format}`);
  }

  return charset;
};

type CFFResult = {
  readonly name: string;
  readonly topDict: TopDict;
  readonly getGlyph: (gid: number) => Glyph;
};

const getBias = (subrsIndex: Index): number => {
  if (subrsIndex.count < 1240) {
    return 107;
  }
  if (subrsIndex.count < 33900) {
    return 1131;
  }
  return 32768;
};

export const parseCFF = async (blob: Blob): Promise<CFFResult> => {
  let offset = 0;

  const headerBuffer = await blob.slice(offset, offset + 4).arrayBuffer();
  const headerView = new DataView(headerBuffer);
  const header = {
    major: headerView.getUint8(0),
    minor: headerView.getUint8(1),
    hdrSize: headerView.getUint8(2),
    offSize: headerView.getUint8(3),
  };
  offset += header.hdrSize;

  const [nameIndex, nameIndexSize] = await parseIndex(blob, offset);
  const name = new TextDecoder().decode(nameIndex.data);
  offset += nameIndexSize;

  const [topDictIndex, topDictIndexSize] = await parseIndex(blob, offset);
  const topDictData = topDictIndex.data;
  offset += topDictIndexSize;

  const [stringIndex, stringIndexSize] = await parseIndex(blob, offset);
  offset += stringIndexSize;

  let getSubrs: (subr: number) => Uint8Array | null = (subr) => null;

  const topDict: TopDict = { ...topDictDefaults };
  parseTopDictData(topDictData, topDict, stringIndex);
  if (topDict.Private) {
    const [offset, size] = topDict.Private;
    const privateDictData = new Uint8Array(
      await blob.slice(offset, size + offset).arrayBuffer(),
    );
    parseTopDictData(privateDictData, topDict, stringIndex);

    if (topDict.Subrs) {
      const [subrsIndex] = await parseIndex(blob, offset + topDict.Subrs);
      const bias = getBias(subrsIndex);

      getSubrs = (subr) => {
        const i = bias + subr;
        if (i < 0 || i > subrsIndex.count) {
          return null;
        }
        const start = subrsIndex.offsets[i] - 1;
        const end = subrsIndex.offsets[i + 1] - 1;
        const data = subrsIndex.data.slice(start, end);
        return data;
      };
    }
  }

  if (!topDict.CharStrings) {
    throw new Error('CharStrings missing in Top Dict');
  }

  if (!topDict.charset) {
    throw new Error('charset missing in Top Dict');
  }

  const [charStringsIndex] = await parseIndex(blob, topDict.CharStrings);

  const nGlyphs = charStringsIndex.count; // only useful for Format 2
  const charset = await parseCharset(blob, topDict, nGlyphs);

  // We don't bother with the Encoding provide by the CFF and instead use
  // 'cmap' instead which provides complete coverage.  The encoding maps
  // unicode code to GID.

  const glyphDict: Record<number, Glyph> = {};

  const getGlyph = (gid: number): Glyph => {
    if (glyphDict[gid]) {
      return glyphDict[gid];
    }

    const start = charStringsIndex.offsets[gid] - 1;
    const end = charStringsIndex.offsets[gid + 1] - 1;

    const glyphData = charStringsIndex.data.slice(start, end);
    const { path, advanceWidth } = parseCharstring(
      glyphData,
      topDict,
      getSubrs,
    );

    const sid = charset[gid];
    const name = getString(sid, stringIndex);

    const glyph: Glyph = {
      name,
      path,
      metrics: {
        advance: advanceWidth,
      },
    };

    glyphDict[gid] = glyph;

    return glyph;
  };

  const result: CFFResult = {
    name,
    topDict,
    getGlyph,
  };

  return result;
};
