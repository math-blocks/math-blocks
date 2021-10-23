import type {
  MathValueRecord,
  MathConstants,
  MathVariants,
  GlyphPartRecord,
  GlyphAssembly,
  GlyphConstruction,
  GlyphVariantRecord,
} from './math-types';

const parseConstants = async (
  blob: Blob,
  start: number,
  end: number,
): Promise<MathConstants> => {
  const constantsBuffer = await blob.slice(start, end).arrayBuffer();
  const constantsView = new DataView(constantsBuffer);

  const getMathValueRecord = (offset: number): MathValueRecord => {
    return {
      value: constantsView.getInt16(offset + 0), // FWORD
      deviceOffset: constantsView.getUint16(offset + 2), // Offset16
    };
  };

  const mathConstants: MathConstants = {
    scriptPercentScaleDown: constantsView.getInt16(0), // int16
    scriptScriptPercentScaleDown: constantsView.getInt16(2), // int16
    delimitedSubFormulaMinHeight: constantsView.getUint16(4), // UFWORD
    displayOperatorMinHeight: constantsView.getUint16(6), // UFWORD
    mathLeading: getMathValueRecord(8),
    axisHeight: getMathValueRecord(12),
    accentBaseHeight: getMathValueRecord(16),
    flattenedAccentBaseHeight: getMathValueRecord(20),
    subscriptShiftDown: getMathValueRecord(24),
    subscriptTopMax: getMathValueRecord(28),
    subscriptBaselineDropMin: getMathValueRecord(32),
    superscriptShiftUp: getMathValueRecord(36),
    superscriptShiftUpCramped: getMathValueRecord(40),
    superscriptBottomMin: getMathValueRecord(44),
    superscriptBaselineDropMax: getMathValueRecord(48),
    subSuperscriptGapMin: getMathValueRecord(52),
    superscriptBottomMaxWithSubscript: getMathValueRecord(56),
    spaceAfterScript: getMathValueRecord(60),
    upperLimitGapMin: getMathValueRecord(64),
    upperLimitBaselineRiseMin: getMathValueRecord(68),
    lowerLimitGapMin: getMathValueRecord(72),
    lowerLimitBaselineDropMin: getMathValueRecord(76),
    stackTopShiftUp: getMathValueRecord(80),
    stackTopDisplayStyleShiftUp: getMathValueRecord(84),
    stackBottomShiftDown: getMathValueRecord(88),
    stackBottomDisplayStyleShiftDown: getMathValueRecord(92),
    stackGapMin: getMathValueRecord(96),
    stackDisplayStyleGapMin: getMathValueRecord(100),
    stretchStackTopShiftUp: getMathValueRecord(104),
    stretchStackBottomShiftDown: getMathValueRecord(108),
    stretchStackGapAboveMin: getMathValueRecord(112),
    stretchStackGapBelowMin: getMathValueRecord(116),
    fractionNumeratorShiftUp: getMathValueRecord(120),
    fractionNumeratorDisplayStyleShiftUp: getMathValueRecord(124),
    fractionDenominatorShiftDown: getMathValueRecord(128),
    fractionDenominatorDisplayStyleShiftDown: getMathValueRecord(132),
    fractionNumeratorGapMin: getMathValueRecord(136),
    fractionNumDisplayStyleGapMin: getMathValueRecord(140),
    fractionRuleThickness: getMathValueRecord(144),
    fractionDenominatorGapMin: getMathValueRecord(148),
    fractionDenomDisplayStyleGapMin: getMathValueRecord(152),
    skewedFractionHorizontalGap: getMathValueRecord(156),
    skewedFractionVerticalGap: getMathValueRecord(160),
    overbarVerticalGap: getMathValueRecord(164),
    overbarRuleThickness: getMathValueRecord(168),
    overbarExtraAscender: getMathValueRecord(172),
    underbarVerticalGap: getMathValueRecord(176),
    underbarRuleThickness: getMathValueRecord(180),
    underbarExtraDescender: getMathValueRecord(184),
    radicalVerticalGap: getMathValueRecord(188),
    radicalDisplayStyleVerticalGap: getMathValueRecord(192),
    radicalRuleThickness: getMathValueRecord(196),
    radicalExtraAscender: getMathValueRecord(200),
    radicalKernBeforeDegree: getMathValueRecord(204),
    radicalKernAfterDegree: getMathValueRecord(208),
    radicalDegreeBottomRaisePercent: constantsView.getInt16(212),
  };

  return mathConstants;
};

const parseCovergeTable = async (
  blob: Blob,
  offset: number,
): Promise<number[]> => {
  const buffer = await blob.slice(offset, offset + 4).arrayBuffer();
  const view = new DataView(buffer);

  const coverageFormat = view.getUint16(0);
  const glyphIDs: number[] = [];

  if (coverageFormat === 1) {
    const glyphCount = view.getUint16(2);

    const glyphArrayBuffer = await blob
      .slice(offset + 4, offset + 4 + glyphCount * 2)
      .arrayBuffer();
    const glyphArrayView = new DataView(glyphArrayBuffer);

    for (let i = 0; i < glyphCount; i++) {
      glyphIDs[i] = glyphArrayView.getUint16(i * 2);
    }
  } else if (coverageFormat === 2) {
    const rangeCount = view.getUint16(2);

    const rangeRecordsBuffer = await blob
      .slice(offset + 4, offset + 4 + rangeCount * 6)
      .arrayBuffer();
    const rangeRecordsView = new DataView(rangeRecordsBuffer);

    for (let i = 0; i < rangeCount; i++) {
      const startGlyphID = rangeRecordsView.getUint16(i * 6 + 0);
      const endGlyphID = rangeRecordsView.getUint16(i * 6 + 2);
      const startCoverageIndex = rangeRecordsView.getUint16(i * 6 + 4);

      for (
        let gid = startGlyphID, index = startCoverageIndex;
        gid <= endGlyphID;
        gid++, index++
      ) {
        glyphIDs[index] = gid;
      }
    }
  } else {
    throw new Error(`Invalid coverageFormat = ${coverageFormat}`);
  }

  return glyphIDs;
};

const parseGlyphAssembly = (view: DataView, offset: number): GlyphAssembly => {
  const getMathValueRecord = (offset: number): MathValueRecord => {
    return {
      value: view.getInt16(offset + 0), // FWORD
      deviceOffset: view.getUint16(offset + 2), // Offset16
    };
  };

  const italicsCorrection = getMathValueRecord(offset + 0);
  const partCount = view.getUint16(offset + 4);
  const partSize = 5 * 2; // 5 * sizeof(uint16)

  const partRecords: GlyphPartRecord[] = [];
  for (let i = 0; i < partCount; i++) {
    partRecords.push({
      glyphID: view.getUint16(offset + 6 + i * partSize + 0),
      startConnectorLength: view.getUint16(offset + 6 + i * partSize + 2),
      endConnectorLength: view.getUint16(offset + 6 + i * partSize + 4),
      fullAdvance: view.getUint16(offset + 6 + i * partSize + 6),
      partsFlags: view.getUint16(offset + 6 + i * partSize + 8),
    });
  }

  return {
    italicsCorrection,
    partRecords,
  };
};

const parseGlyphConstruction = (
  view: DataView,
  offset: number,
): GlyphConstruction => {
  const glyphAssemblyOffset = view.getUint16(offset + 0);
  const variantCount = view.getUint16(offset + 2);
  const recordSize = 4; // sizeof(uint16) + sizeof(UFWORD)

  const mathGlyphVariantRecords: GlyphVariantRecord[] = [];
  for (let i = 0; i < variantCount; i++) {
    mathGlyphVariantRecords.push({
      variantGlyph: view.getUint16(offset + 4 + i * recordSize + 0),
      advanceMeasurement: view.getUint16(offset + 4 + i * recordSize + 2),
    });
  }

  const glyphAssembly = glyphAssemblyOffset
    ? parseGlyphAssembly(view, offset + glyphAssemblyOffset)
    : null;

  return {
    glyphAssembly,
    mathGlyphVariantRecords,
  };
};

type MathGlyphInfo = {
  readonly isExtendedShape: (glyphID: number) => boolean;
};

const parseMathGlyphInfo = async (
  blob: Blob,
  start: number,
  end: number,
): Promise<MathGlyphInfo> => {
  const mathGlyphInfoBlob = blob.slice(start, end);
  const buffer = await mathGlyphInfoBlob.arrayBuffer();
  const view = new DataView(buffer);

  // const mathItalicsCorrectionInfoOffset = view.getUint16(0);
  // const mathTopAccentAttachmentOffset = view.getUint16(2);
  const extendedShapeCoverageOffset = view.getUint16(4);
  // const mathKernInfoOffset = view.getUint16(6);

  const extendedShapeCoverage = await parseCovergeTable(
    mathGlyphInfoBlob,
    extendedShapeCoverageOffset,
  );

  return {
    isExtendedShape: (glyphID) => extendedShapeCoverage.indexOf(glyphID) !== -1,
  };
};

const parseVariants = async (
  blob: Blob,
  start: number,
  end: number,
): Promise<MathVariants> => {
  const variantsBlob = blob.slice(start, end);
  const buffer = await variantsBlob.arrayBuffer();
  const view = new DataView(buffer);

  // These offsets are from the start of the MathVariants table
  const minConnectorOverlap = view.getUint16(0);
  const vertGlyphCoverageOffset = view.getUint16(2);
  const horizGlyphCoverageOffset = view.getUint16(4);
  const vertGlyphCount = view.getUint16(6);
  const horizGlyphCount = view.getUint16(8);

  const vertGlyphCoverageTable = await parseCovergeTable(
    variantsBlob,
    vertGlyphCoverageOffset,
  );
  const horizGlyphCoverageTable = await parseCovergeTable(
    variantsBlob,
    horizGlyphCoverageOffset,
  );

  const vertGlyphConstructionDict: Record<number, GlyphConstruction> = {};
  const horizGlyphConstructionDict: Record<number, GlyphConstruction> = {};

  const variants: MathVariants = {
    minConnectorOverlap,
    vertGlyphCoverageOffset,
    horizGlyphCoverageOffset,
    vertGlyphCount,
    horizGlyphCount,
    getVertGlyphConstruction: (glyphID: number) => {
      const index = vertGlyphCoverageTable.indexOf(glyphID);
      if (index === -1) {
        return null;
      }

      if (vertGlyphConstructionDict[glyphID]) {
        return vertGlyphConstructionDict[glyphID];
      }

      // offset is from the start of the MathVariants Table
      const offset = view.getUint16(10 + index * 2);
      const construction = parseGlyphConstruction(view, offset);
      vertGlyphConstructionDict[glyphID] = construction;
      return construction;
    },
    getHorizGlyphConstruction: (glyphID: number) => {
      const index = horizGlyphCoverageTable.indexOf(glyphID);
      if (index === -1) {
        return null;
      }

      if (horizGlyphConstructionDict[glyphID]) {
        return horizGlyphConstructionDict[glyphID];
      }

      // offset is from the start of the MathVariants Table
      const offset = view.getUint16(10 + vertGlyphCount * 2 + index * 2);
      const construction = parseGlyphConstruction(view, offset);
      horizGlyphConstructionDict[glyphID] = construction;
      return construction;
    },
  };

  return variants;
};

export type MathTable = {
  readonly constants: MathConstants;
  readonly variants: MathVariants;
  readonly glyphInfo: MathGlyphInfo;
};

export const parseMATH = async (blob: Blob): Promise<MathTable> => {
  // TODO: check that tableRecord.tableTag === "MATH" before proceeding

  type MathHeader = {
    majorVersion: number; // uint16
    minorVersion: number; // uint16
    mathConstantsOffset: number; // uint16
    mathGlyphInfoOffset: number; // uint16
    mathVariantsOffset: number; // uint16
  };

  const headerByteCount = 5 * 2; // 5 * sizeof(uint16)

  const headerBuffer = await blob.slice(0, headerByteCount).arrayBuffer();
  const headerView = new DataView(headerBuffer);

  const header: MathHeader = {
    majorVersion: headerView.getUint16(0),
    minorVersion: headerView.getUint16(2),
    mathConstantsOffset: headerView.getUint16(4),
    mathGlyphInfoOffset: headerView.getUint16(6),
    mathVariantsOffset: headerView.getUint16(8),
  };

  const constants = await parseConstants(
    blob,
    header.mathConstantsOffset,
    header.mathGlyphInfoOffset,
  );

  const glyphInfo = await parseMathGlyphInfo(
    blob,
    header.mathGlyphInfoOffset,
    header.mathVariantsOffset,
  );

  const variants = await parseVariants(
    blob,
    header.mathVariantsOffset,
    blob.size,
  );

  return {
    constants,
    variants,
    glyphInfo,
  };
};
