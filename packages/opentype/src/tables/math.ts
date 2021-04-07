// FWORD - int16 that describes a quantity in font design units
// UFWORD - uint16 that describes a quantity in font design units

type MathValueRecord = {
    value: number; // FWORD
    deviceOffset: number; // Offset16
};

export type MathConstants = {
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
    stretchStackBottomShiftDown: MathValueRecord;
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
    radicalDegreeBottomRaisePercent: number; // int16
};

export const parseMATH = async (blob: Blob): Promise<MathConstants> => {
    // TODO: check that tableRecord.tableTag === "MATH" before proceeding

    type MathHeader = {
        majorVersion: number; // uint16
        minorVersion: number; // uint16
        mathConstantsOffset: number; // uint16
        mathGlyphInfoOffset: number; // uint16
        mathVariantsOffset: number; // uint16
    };

    const headerByteCount = 5 * 2;

    const headerBuffer = await blob.slice(0, headerByteCount).arrayBuffer();
    const headerView = new DataView(headerBuffer);

    const header: MathHeader = {
        majorVersion: headerView.getUint16(0),
        minorVersion: headerView.getUint16(2),
        mathConstantsOffset: headerView.getUint16(4),
        mathGlyphInfoOffset: headerView.getUint16(6),
        mathVariantsOffset: headerView.getUint16(8),
    };

    const constantsBuffer = await blob
        .slice(header.mathConstantsOffset, header.mathGlyphInfoOffset)
        .arrayBuffer();
    const constantsView = new DataView(constantsBuffer);

    const getMathValueRecord = (offset: number): MathValueRecord => {
        return {
            value: constantsView.getInt16(offset + 0), // FWORD
            deviceOffset: constantsView.getUint16(offset + 2), // Offset16
        };
    };

    console.log(
        "math constants size = " +
            (header.mathConstantsOffset - header.mathGlyphInfoOffset),
    );

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
        stretchStackBottomShiftDown: getMathValueRecord(108),
        stretchStackGapAboveMin: getMathValueRecord(112),
        stretchStackGapBelowMin: getMathValueRecord(116),
        fractionNumeratorShiftUp: getMathValueRecord(120),
        fractionNumeratorDisplayStyleShiftUp: getMathValueRecord(124),
        fractionDenominatorShiftDown: getMathValueRecord(128),
        fractionDenominatorDisplayStyleShiftDown: getMathValueRecord(132),
        fractionNumeratorGapMin: getMathValueRecord(136),
        fractionNumDispalyStyleGapMin: getMathValueRecord(140),
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

    // TODO: parse coverage tables

    // TODO: parse glyph outlines
    // TODO: parse MathVariants
    // we don't need to parse the whole MathVariants table, we can parse on demand
    // the coverage tables should be parsed up front since we need to look through
    // the table to know which glyphs are handled.

    return mathConstants;
};
