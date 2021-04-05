import {STANDARD_STRINGS} from "./standard-strings";

type Index = {
    count: number; // Card16 (uint16)
    offSize: number; // OffSize (1 - 4)
    offsets: number[]; // length = count + 1
    data: Uint8Array;
};

const parseIndex = async (
    blob: Blob,
    offset: number,
): Promise<[Index, number]> => {
    console.log(`blob.slice(${offset}, ${offset + 5})`);
    let buffer = await blob.slice(offset, offset + 3).arrayBuffer();
    let view = new DataView(buffer);

    const count = view.getUint16(0);
    const offSize = view.getUint8(2);

    buffer = await blob
        .slice(offset + 3, offset + 3 + (count + 1) * offSize)
        .arrayBuffer();
    view = new DataView(buffer);
    console.log(`count = ${count}`);
    console.log(`offSize = ${offSize}`);

    // TODO: handle offsetSize === 3 by using shift left
    const offsets: number[] = [];
    for (let i = 0; i < count + 1; i += 1) {
        let value = 0;
        for (let j = 0; j < offSize; j += 1) {
            value = value << 8;
            value += view.getUint8(offSize * i + j);
        }
        offsets.push(value);
    }

    console.log(offsets);

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

    const size = 3 + offsets.length * offSize + offsets[offsets.length - 1] - 1;

    return [nameIndex, size];
};

type TopDict = {
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

const decoder = new TextDecoder();

const getString = (operand: number, stringIndex: Index): string => {
    if (operand < 391) {
        return STANDARD_STRINGS[operand];
    }

    const {offsets, data} = stringIndex;

    const index = operand - 391;
    const start = offsets[index] - 1;
    const end = offsets[index + 1] - 1;

    return decoder.decode(data.slice(start, end));
};

const parseTopDictData = (
    data: Uint8Array,
    dict: TopDict, // this value is mutated
    stringIndex: Index,
): void => {
    const stack: number[] = [];

    let i = 0;

    const getOperand = (): number => {
        const operand = stack.pop();
        if (!operand) {
            throw new Error("missing operand");
        }
        return operand;
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
                const array = [
                    getOperand(),
                    getOperand(),
                    getOperand(),
                    getOperand(),
                ];
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
        }

        // b0 is reserved, throw an error? ignore?
    }
};

type Command =
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

type Path = Command[];

type Glyph = {
    path: Path;
    advanceWidth: number;
    // TODO: include other metrics
};

const parseCharstring = (data: Uint8Array, topDict: TopDict): Glyph => {
    let i = 0;
    const stack: number[] = [];

    let x = 0;
    let y = 0;

    let width = topDict.defaultWidthX;
    let hasWidth = false;
    let nStems = 0;

    const path: Path = [];

    let open = false;
    const newContour = (x: number, y: number): void => {
        if (open) {
            path.push({type: "Z"});
        }

        path.push({type: "M", x, y});
        open = true;
    };

    const shift = (): number => {
        const value = stack.shift();
        if (typeof value === "undefined") {
            throw new Error("Not enough operands");
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
                    path.push({type: "L", x, y});
                }
                break;
            }

            // hlineto: |- dx1 {dya dxb}* hlineto (6) |-
            //          |- {dxa dyb}+ hlineto (6) |-
            case 6: {
                while (stack.length > 0) {
                    x += shift();
                    path.push({type: "L", x, y});
                    if (stack.length === 0) {
                        break;
                    }
                    y += shift();
                    path.push({type: "L", x, y});
                }
                break;
            }

            // vlineto: |- dy1 {dxa dyb}* vlineto (7) |-
            //          |- {dya dxb}+ vlineto (7) |-
            case 7: {
                while (stack.length > 0) {
                    y += shift();
                    path.push({type: "L", x, y});
                    if (stack.length === 0) {
                        break;
                    }
                    x += shift();
                    path.push({type: "L", x, y});
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

                    path.push({type: "C", x1, y1, x2, y2, x, y});
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

                    path.push({type: "C", x1, y1, x2, y2, x, y});
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

                    path.push({type: "C", x1, y1, x2, y2, x, y});

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

                    path.push({type: "C", x1, y1, x2, y2, x, y});
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

                    path.push({type: "C", x1, y1, x2, y2, x, y});
                }

                const dxd = shift();
                const dyd = shift();

                x += dxd;
                y += dyd;

                path.push({type: "L", x, y});

                break;
            }

            // rlinecurve: {dxa dya}+ dxb dyb dxc dyc dxd dyd rlinecurve (25)
            case 25: {
                while (stack.length > 6) {
                    const dxa = shift();
                    const dya = shift();

                    x += dxa;
                    y += dya;

                    path.push({type: "L", x, y});
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

                path.push({type: "C", x1, y1, x2, y2, x, y});

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

                    path.push({type: "C", x1, y1, x2, y2, x, y});

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

                    path.push({type: "C", x1, y1, x2, y2, x, y});
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

                    path.push({type: "C", x1, y1, x2, y2, x, y});
                }

                break;
            }

            case 12: {
                const b1 = data[i++];

                switch (b1) {
                    // flex: dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 dx6 dy6 fd flex (12 35)
                    case 35: {
                        break;
                    }

                    // hflex: dx1 dx2 dy2 dx3 dx4 dx5 dx6 hflex (12 34)
                    case 34: {
                        break;
                    }

                    // hflex1: dx1 dy1 dx2 dy2 dx3 dx4 dx5 dy5 dx6 hflex1 (12 36)
                    case 36: {
                        break;
                    }

                    // flex1: dx1 dy1 dx2 dy2 dy3 dx4 dy4 dx5 dy5 d6 flex1 (12 37)
                    case 37: {
                        break;
                    }

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
                    path.push({type: "Z"});
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
                    stack.push(
                        ((b1 << 24) | (b2 << 16) | (b3 << 8) | b4) / 65536,
                    );
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

    const glyph: Glyph = {
        path,
        advanceWidth: width,
    };

    return glyph;
};

export const parseCFF = async (blob: Blob): Promise<void> => {
    let offset = 0;

    const headerBuffer = await blob.slice(offset, offset + 4).arrayBuffer();
    const headerView = new DataView(headerBuffer);

    const header = {
        major: headerView.getUint8(0),
        minor: headerView.getUint8(1),
        hdrSize: headerView.getUint8(2),
        offSize: headerView.getUint8(3),
    };
    console.log(`header = `, header);

    offset += header.hdrSize;

    const [nameIndex, nameIndexSize] = await parseIndex(blob, offset);
    console.log("nameIndex = ", nameIndex);
    console.log("name = " + new TextDecoder().decode(nameIndex.data));
    offset += nameIndexSize;

    const [topDictIndex, topDictIndexSize] = await parseIndex(blob, offset);
    console.log("topDictIndex = ", topDictIndex);
    const topDictData = topDictIndex.data;
    offset += topDictIndexSize;

    const [stringIndex, stringIndexSize] = await parseIndex(blob, offset);
    console.log("stringIndex = ", stringIndex);
    offset += stringIndexSize;

    const topDict: TopDict = {...topDictDefaults};
    parseTopDictData(topDictData, topDict, stringIndex);
    if (topDict.Private) {
        const [offset, size] = topDict.Private;
        const privateDictData = new Uint8Array(
            await blob.slice(offset, size + offset).arrayBuffer(),
        );
        parseTopDictData(privateDictData, topDict, stringIndex);
    }
    console.log("topDict = ", topDict);

    if (topDict.CharStrings && topDict.charset) {
        console.log(`CharStrings = ${topDict.CharStrings}`);
        const [charStringsIndex] = await parseIndex(blob, topDict.CharStrings);
        console.log("charStringsIndex = ", charStringsIndex);

        // only useful for Format 0
        const nGlyphs = charStringsIndex.count;

        const charsetData = await blob
            .slice(
                topDict.charset,
                topDict.CharStrings, // NOTE: we can only do this because there's no FDSelect
            )
            .arrayBuffer();
        const view = new DataView(charsetData);
        const format = view.getUint8(0);
        console.log(`format = ${format}`);
        console.log(charsetData.byteLength);

        // Charset is a mapping between GID and SID
        let gid = 1;
        let i = 1;
        const charset: Record<number, number> = {};
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

        let name = getString(charset[1064], stringIndex);
        console.log(`charset[1064] = ${charset[1064]} (${name})`);
        name = getString(charset[1301], stringIndex);
        console.log(`charset[1301] = ${charset[1301]} (${name})`);

        // Charset provides a mapping from GID to SID which allows us to get
        // string names for each of the glyphs.

        // We don't bother with the Encoding provide by the CFF and instead use
        // 'cmap' instead which provides complete coverage.  The encoding maps
        // unicode code to GID.

        // There are some GIDs in the Charset whcih don't have unicode codes
        // associated with them in the encoding from 'cmap'.  These are things
        // like variants and extended forms.  This are handled by the MATH table.

        // TODO: parse CharStrings
        // let's get the data for parenleft which has GID 1064
        const start = charStringsIndex.offsets[1064] - 1;
        const end = charStringsIndex.offsets[1064 + 1] - 1;
        const glyphData = charStringsIndex.data.slice(start, end);

        console.log("glyphData = ", glyphData);
        console.log("parsed data = ", parseCharstring(glyphData, topDict));

        // There needs to be a two step process:
        // 1: convert bytes to charstring numbers
        // 2: interpret charstring numbers operators as drawing commands
    }

    console.log("parenleft?");
    console.log(getString(9, stringIndex));
};
