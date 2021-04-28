// FWORD - int16 that describes a quantity in font design units
// UFWORD - uint16 that describes a quantity in font design units

export type MathValueRecord = {
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

export type GlyphVariantRecord = {
    variantGlyph: number; // Glyph ID
    advanceMeasurement: number; // UFWORD (uint16 in design units)
};

export type GlyphPartRecord = {
    glyphID: number; // uint16
    startConnectorLength: number; // UFWORD (uint16 in design units)
    endConnectorLength: number; // UFWORD (uint16 in design units)
    fullAdvance: number; // UFWORD (uint16 in design units)
    partsFlags: number; // uint16
};

export type GlyphAssembly = {
    italicsCorrection: MathValueRecord;
    partRecords: GlyphPartRecord[];
};

export type GlyphConstruction = {
    glyphAssembly: GlyphAssembly | null;
    mathGlyphVariantRecords: GlyphVariantRecord[];
};

export type MathVariants = {
    minConnectorOverlap: number; // UFWORD (uint16 in design units)
    vertGlyphCoverageOffset: number; // Offset16 (uint16)
    horizGlyphCoverageOffset: number; // Offset16 (uint16)
    vertGlyphCount: number; // uint16
    horizGlyphCount: number; // uint16
    getVertGlyphConstruction: (glyphID: number) => GlyphConstruction | null;
    getHorizGlyphConstruction: (glyphID: number) => GlyphConstruction | null;
};
