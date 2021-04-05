import type {TableRecord} from "./types";

// FWORD - int16 that describes a quantity in font design units
// UFWORD - uint16 that describes a quantity in font design units

type MathValueRecord = {
    value: number; // FWORD
    deviceOffset: number; // Offset16
};

type MathConstants = {
    scriptPercentScaleDown: number; // int16
    scriptScriptPercentScaleDown: number; // int16
    delimitedSubFormulatMinHeight: number; // UFWORD
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
    stretchStackGapAboveMin: MathValueRecord;
    stretchStackGapBelowMin: MathValueRecord;
    fractionNumeratorShiftUp: MathValueRecord;
    fractionNumeratorDisplayStyleShiftUp: MathValueRecord;
    fractionDenominatorShiftDown: MathValueRecord;
    fractionDenominatorDisplayStyleShiftDown: MathValueRecord;
    fractionNumeratorGapMin: MathValueRecord;
    fractionNumDispalyStyleGapMin: MathValueRecord;
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
    radicalDegreeBottomRaisePercent: MathValueRecord;
};

export const parseMATH = async (
    blob: Blob,
    tableRecord: TableRecord,
): Promise<MathConstants> => {
    // TODO: check that tableRecord.tableTag === "MATH" before proceeding

    type MathHeader = {
        majorVersion: number; // uint16
        minorVersion: number; // uint16
        mathConstantsOffset: number; // uint16
        mathGlyphInfoOffset: number; // uint16
        mathVariantsOffset: number; // uint16
    };

    const headerByteCount = 5 * 2;

    const headerBuffer = await blob
        .slice(tableRecord.offset, tableRecord.offset + headerByteCount)
        .arrayBuffer();
    const headerView = new DataView(headerBuffer);

    const header: MathHeader = {
        majorVersion: headerView.getUint16(0),
        minorVersion: headerView.getUint16(2),
        mathConstantsOffset: headerView.getUint16(4),
        mathGlyphInfoOffset: headerView.getUint16(6),
        mathVariantsOffset: headerView.getUint16(8),
    };

    const constantsBuffer = await blob
        .slice(
            tableRecord.offset + header.mathConstantsOffset,
            tableRecord.offset + header.mathGlyphInfoOffset,
        )
        .arrayBuffer();
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
        delimitedSubFormulatMinHeight: constantsView.getUint16(4), // UFWORD
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
        stretchStackGapAboveMin: getMathValueRecord(108),
        stretchStackGapBelowMin: getMathValueRecord(112),
        fractionNumeratorShiftUp: getMathValueRecord(116),
        fractionNumeratorDisplayStyleShiftUp: getMathValueRecord(120),
        fractionDenominatorShiftDown: getMathValueRecord(124),
        fractionDenominatorDisplayStyleShiftDown: getMathValueRecord(128),
        fractionNumeratorGapMin: getMathValueRecord(132),
        fractionNumDispalyStyleGapMin: getMathValueRecord(136),
        fractionRuleThickness: getMathValueRecord(140),
        fractionDenominatorGapMin: getMathValueRecord(144),
        fractionDenomDisplayStyleGapMin: getMathValueRecord(148),
        skewedFractionHorizontalGap: getMathValueRecord(152),
        skewedFractionVerticalGap: getMathValueRecord(156),
        overbarVerticalGap: getMathValueRecord(160),
        overbarRuleThickness: getMathValueRecord(164),
        overbarExtraAscender: getMathValueRecord(168),
        underbarVerticalGap: getMathValueRecord(172),
        underbarRuleThickness: getMathValueRecord(176),
        underbarExtraDescender: getMathValueRecord(180),
        radicalVerticalGap: getMathValueRecord(184),
        radicalDisplayStyleVerticalGap: getMathValueRecord(188),
        radicalRuleThickness: getMathValueRecord(192),
        radicalExtraAscender: getMathValueRecord(196),
        radicalKernBeforeDegree: getMathValueRecord(200),
        radicalKernAfterDegree: getMathValueRecord(204),
        radicalDegreeBottomRaisePercent: getMathValueRecord(208),
    };

    // TODO: parse coverage tables

    // TODO: parse glyph outlines
    // TODO: parse MathVariants
    // we don't need to parse the whole MathVariants table, we can parse on demand
    // the coverage tables should be parsed up front since we need to look through
    // the table to know which glyphs are handled.

    return mathConstants;
};
