// FWORD - int16 that describes a quantity in font design units
// UFWORD - uint16 that describes a quantity in font design units

type MathValueRecord = {
    value: number; // FWORD
    deviceOffset: number; // Offset16
};

export type MathConstants = {
    scriptPercentScaleDown: number; // int16
    scriptScriptPercentScaleDown: number; // int16
    delimitedSubFormulaMinHeight: number; // UFWORD
    displayOperatorMinHeight: number; // UFWORD
    mathLeading: MathValueRecord;
    axisHeight: MathValueRecord;
    accentBaseHeight: MathValueRecord;
    flattenedAccentBaseHeight: MathValueRecord;
    subscriptShiftDown: MathValueRecord;
    subscriptTopMax: MathValueRecord;
    subscriptBaselineDropMin: MathValueRecord;
    superscriptShiftUp: MathValueRecord;
    superscriptShiftUpCramped: MathValueRecord;
    superscriptBottomMin: MathValueRecord;
    superscriptBaselineDropMax: MathValueRecord;
    subSuperscriptGapMin: MathValueRecord;
    superscriptBottomMaxWithSubscript: MathValueRecord;
    spaceAfterScript: MathValueRecord;
    upperLimitGapMin: MathValueRecord;
    upperLimitBaselineRiseMin: MathValueRecord;
    lowerLimitGapMin: MathValueRecord;
    lowerLimitBaselineDropMin: MathValueRecord;
    stackTopShiftUp: MathValueRecord;
    stackTopDisplayStyleShiftUp: MathValueRecord;
    stackBottomShiftDown: MathValueRecord;
    stackBottomDisplayStyleShiftDown: MathValueRecord;
    stackGapMin: MathValueRecord;
    stackDisplayStyleGapMin: MathValueRecord;
    stretchStackTopShiftUp: MathValueRecord;
    stretchStackBottomShiftDown: MathValueRecord;
    stretchStackGapAboveMin: MathValueRecord;
    stretchStackGapBelowMin: MathValueRecord;
    fractionNumeratorShiftUp: MathValueRecord;
    fractionNumeratorDisplayStyleShiftUp: MathValueRecord;
    fractionDenominatorShiftDown: MathValueRecord;
    fractionDenominatorDisplayStyleShiftDown: MathValueRecord;
    fractionNumeratorGapMin: MathValueRecord;
    fractionNumDisplayStyleGapMin: MathValueRecord;
    fractionRuleThickness: MathValueRecord;
    fractionDenominatorGapMin: MathValueRecord;
    fractionDenomDisplayStyleGapMin: MathValueRecord;
    skewedFractionHorizontalGap: MathValueRecord;
    skewedFractionVerticalGap: MathValueRecord;
    overbarVerticalGap: MathValueRecord;
    overbarRuleThickness: MathValueRecord;
    overbarExtraAscender: MathValueRecord;
    underbarVerticalGap: MathValueRecord;
    underbarRuleThickness: MathValueRecord;
    underbarExtraDescender: MathValueRecord;
    radicalVerticalGap: MathValueRecord;
    radicalDisplayStyleVerticalGap: MathValueRecord;
    radicalRuleThickness: MathValueRecord;
    radicalExtraAscender: MathValueRecord;
    radicalKernBeforeDegree: MathValueRecord;
    radicalKernAfterDegree: MathValueRecord;
    radicalDegreeBottomRaisePercent: number; // int16
};

export type MathResult = {
    constants: MathConstants;
    variants: VariantsTable;
};

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

type GlyphVariantRecord = {
    variantGlyph: number; // Glyph ID
    advanceMeasurement: number; // UFWORD (uint16 in design units)
};

type GlyphPartRecord = {
    glyphID: number; // uint16
    startConnectorLength: number; // UFWORD (uint16 in design units)
    endConnectorLength: number; // UFWORD (uint16 in design units)
    fullAdvance: number; // UFWORD (uint16 in design units)
    partsFlags: number; // uint16
};

type GlyphAssembly = {
    italicsCorrection: MathValueRecord;
    partRecords: GlyphPartRecord[];
};

type GlyphConstruction = {
    glyphAssembly: GlyphAssembly | null;
    mathGlyphVariantRecords: GlyphVariantRecord[];
};

export type VariantsTable = {
    minConnectorOverlap: number; // UFWORD (uint16 in design units)
    vertGlyphCoverageOffset: number; // Offset16 (uint16)
    horizGlyphCoverageOffset: number; // Offset16 (uint16)
    vertGlyphCount: number; // uint16
    horizGlyphCount: number; // uint16
    getVertGlyphConstruction: (
        glyphID: number,
    ) => Promise<GlyphConstruction | null>;
    getHorizGlyphConstruction: (
        glyphID: number,
    ) => Promise<GlyphConstruction | null>;
};

type CoverageTable = number[]; // Glyph IDs

const parseCovergeTable = async (
    blob: Blob,
    offset: number,
): Promise<CoverageTable> => {
    const buffer = await blob.slice(offset, offset + 4).arrayBuffer();
    const view = new DataView(buffer);

    const coverageFormat = view.getUint16(0);
    if (coverageFormat !== 2) {
        throw new Error(`We don't handle coverageFormat = ${coverageFormat}`);
    }
    const rangeCount = view.getUint16(2);

    const rangeRecordsBuffer = await blob
        .slice(offset + 4, offset + 4 + rangeCount * 6)
        .arrayBuffer();
    const rangeRecordsView = new DataView(rangeRecordsBuffer);

    const result: CoverageTable = [];

    for (let i = 0; i < rangeCount; i++) {
        const startGlyphID = rangeRecordsView.getUint16(i * 6 + 0);
        const endGlyphID = rangeRecordsView.getUint16(i * 6 + 2);
        const startCoverageIndex = rangeRecordsView.getUint16(i * 6 + 4);

        for (
            let gid = startGlyphID, index = startCoverageIndex;
            gid <= endGlyphID;
            gid++, index++
        ) {
            result[index] = gid;
        }
    }

    return result;
};

const parseGlyphAssembly = async (
    blob: Blob,
    offset: number,
): Promise<GlyphAssembly> => {
    const buffer = await blob.slice(offset, offset + 6).arrayBuffer();
    const view = new DataView(buffer);

    const getMathValueRecord = (offset: number): MathValueRecord => {
        return {
            value: view.getInt16(offset + 0), // FWORD
            deviceOffset: view.getUint16(offset + 2), // Offset16
        };
    };

    const italicsCorrection = getMathValueRecord(0);
    const partCount = view.getUint16(4);

    const partSize = 5 * 2; // 5 * sizeof(uint16)
    const glyphPartsBuffer = await blob
        .slice(offset + 6, offset + 6 + partCount * partSize)
        .arrayBuffer();
    const glyphPartsView = new DataView(glyphPartsBuffer);

    const partRecords: GlyphPartRecord[] = [];
    for (let i = 0; i < partCount; i++) {
        partRecords.push({
            glyphID: glyphPartsView.getUint16(i * partSize + 0),
            startConnectorLength: glyphPartsView.getUint16(i * partSize + 2),
            endConnectorLength: glyphPartsView.getUint16(i * partSize + 4),
            fullAdvance: glyphPartsView.getUint16(i * partSize + 6),
            partsFlags: glyphPartsView.getUint16(i * partSize + 8),
        });
    }

    return {
        italicsCorrection,
        partRecords,
    };
};

const parseGlyphConstruction = async (
    blob: Blob,
    offset: number,
): Promise<GlyphConstruction> => {
    const buffer = await blob.slice(offset, offset + 4).arrayBuffer();
    const view = new DataView(buffer);

    // TODO: parse the assembly as well
    const glyphAssemblyOffset = view.getUint16(0);
    const variantCount = view.getUint16(2);

    const mathGlyphVariantRecords: GlyphVariantRecord[] = [];

    // TODO: we could probably avoid creating this array buffer if we can
    // compute the entire size of this construction beforehand.
    const recordSize = 4; // sizeof(uint16) + sizeof(UFWORD)
    const recordsBuffer = await blob
        .slice(offset + 4, offset + 4 + variantCount * recordSize)
        .arrayBuffer();
    const recordsView = new DataView(recordsBuffer);

    for (let i = 0; i < variantCount; i++) {
        mathGlyphVariantRecords.push({
            variantGlyph: recordsView.getUint16(i * recordSize + 0),
            advanceMeasurement: recordsView.getUint16(i * recordSize + 2),
        });
    }

    const glyphAssembly = glyphAssemblyOffset
        ? await parseGlyphAssembly(blob, offset + glyphAssemblyOffset)
        : null;

    return {
        glyphAssembly,
        mathGlyphVariantRecords,
    };
};

const parseVariants = async (
    blob: Blob,
    start: number,
    end: number,
): Promise<VariantsTable> => {
    const buffer = await blob.slice(start, end).arrayBuffer();
    const view = new DataView(buffer);

    // These offsets are from the start of the MathVariants tabls
    const vertGlyphCoverageOffset = view.getUint16(2);
    const horizGlyphCoverageOffset = view.getUint16(4);
    const vertGlyphCount = view.getUint16(6);
    const horizGlyphCount = view.getUint16(8);

    const vertGlyphCoverageTable = await parseCovergeTable(
        blob,
        start + vertGlyphCoverageOffset,
    );
    const horizGlyphCoverageTable = await parseCovergeTable(
        blob,
        start + horizGlyphCoverageOffset,
    );

    const vertGlyphConstructionDict: Record<number, GlyphConstruction> = {};
    const horizGlyphConstructionDict: Record<number, GlyphConstruction> = {};

    const variants: VariantsTable = {
        minConnectorOverlap: view.getUint16(0),
        vertGlyphCoverageOffset,
        horizGlyphCoverageOffset,
        vertGlyphCount,
        horizGlyphCount,
        getVertGlyphConstruction: async (glyphID: number) => {
            const index = vertGlyphCoverageTable.indexOf(glyphID);
            if (index === -1) {
                return null;
            }

            if (vertGlyphConstructionDict[glyphID]) {
                return vertGlyphConstructionDict[glyphID];
            }

            // offset is from the start of the MathVariants Table
            const offset = view.getUint16(10 + index * 2);
            const construction = await parseGlyphConstruction(
                blob,
                start + offset,
            );
            vertGlyphConstructionDict[glyphID] = construction;
            return construction;
        },
        getHorizGlyphConstruction: async (glyphID: number) => {
            const index = horizGlyphCoverageTable.indexOf(glyphID);
            if (index === -1) {
                return null;
            }

            if (horizGlyphConstructionDict[glyphID]) {
                return horizGlyphConstructionDict[glyphID];
            }

            // offset is from the start of the MathVariants Table
            const offset = view.getUint16(10 + vertGlyphCount * 2 + index * 2);
            const construction = await parseGlyphConstruction(
                blob,
                start + offset,
            );
            horizGlyphConstructionDict[glyphID] = construction;
            return construction;
        },
    };

    return variants;
};

export const parseMATH = async (blob: Blob): Promise<MathResult> => {
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

    // TODO: parse MathGlyphInfo Table

    const constants = await parseConstants(
        blob,
        header.mathConstantsOffset,
        header.mathGlyphInfoOffset,
    );

    const variants = await parseVariants(
        blob,
        header.mathVariantsOffset,
        blob.size,
    );

    return {
        constants,
        variants,
    };
};
