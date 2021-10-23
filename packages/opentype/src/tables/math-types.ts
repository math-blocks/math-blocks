// FWORD - int16 that describes a quantity in font design units
// UFWORD - uint16 that describes a quantity in font design units

export type MathValueRecord = {
  readonly value: number; // FWORD
  readonly deviceOffset: number; // Offset16
};

export type MathConstants = {
  readonly scriptPercentScaleDown: number; // int16
  readonly scriptScriptPercentScaleDown: number; // int16
  readonly delimitedSubFormulaMinHeight: number; // UFWORD
  readonly displayOperatorMinHeight: number; // UFWORD
  readonly mathLeading: MathValueRecord;
  readonly axisHeight: MathValueRecord;
  readonly accentBaseHeight: MathValueRecord;
  readonly flattenedAccentBaseHeight: MathValueRecord;
  readonly subscriptShiftDown: MathValueRecord;
  readonly subscriptTopMax: MathValueRecord;
  readonly subscriptBaselineDropMin: MathValueRecord;
  readonly superscriptShiftUp: MathValueRecord;
  readonly superscriptShiftUpCramped: MathValueRecord;
  readonly superscriptBottomMin: MathValueRecord;
  readonly superscriptBaselineDropMax: MathValueRecord;
  readonly subSuperscriptGapMin: MathValueRecord;
  readonly superscriptBottomMaxWithSubscript: MathValueRecord;
  readonly spaceAfterScript: MathValueRecord;
  readonly upperLimitGapMin: MathValueRecord;
  readonly upperLimitBaselineRiseMin: MathValueRecord;
  readonly lowerLimitGapMin: MathValueRecord;
  readonly lowerLimitBaselineDropMin: MathValueRecord;
  readonly stackTopShiftUp: MathValueRecord;
  readonly stackTopDisplayStyleShiftUp: MathValueRecord;
  readonly stackBottomShiftDown: MathValueRecord;
  readonly stackBottomDisplayStyleShiftDown: MathValueRecord;
  readonly stackGapMin: MathValueRecord;
  readonly stackDisplayStyleGapMin: MathValueRecord;
  readonly stretchStackTopShiftUp: MathValueRecord;
  readonly stretchStackBottomShiftDown: MathValueRecord;
  readonly stretchStackGapAboveMin: MathValueRecord;
  readonly stretchStackGapBelowMin: MathValueRecord;
  readonly fractionNumeratorShiftUp: MathValueRecord;
  readonly fractionNumeratorDisplayStyleShiftUp: MathValueRecord;
  readonly fractionDenominatorShiftDown: MathValueRecord;
  readonly fractionDenominatorDisplayStyleShiftDown: MathValueRecord;
  readonly fractionNumeratorGapMin: MathValueRecord;
  readonly fractionNumDisplayStyleGapMin: MathValueRecord;
  readonly fractionRuleThickness: MathValueRecord;
  readonly fractionDenominatorGapMin: MathValueRecord;
  readonly fractionDenomDisplayStyleGapMin: MathValueRecord;
  readonly skewedFractionHorizontalGap: MathValueRecord;
  readonly skewedFractionVerticalGap: MathValueRecord;
  readonly overbarVerticalGap: MathValueRecord;
  readonly overbarRuleThickness: MathValueRecord;
  readonly overbarExtraAscender: MathValueRecord;
  readonly underbarVerticalGap: MathValueRecord;
  readonly underbarRuleThickness: MathValueRecord;
  readonly underbarExtraDescender: MathValueRecord;
  readonly radicalVerticalGap: MathValueRecord;
  readonly radicalDisplayStyleVerticalGap: MathValueRecord;
  readonly radicalRuleThickness: MathValueRecord;
  readonly radicalExtraAscender: MathValueRecord;
  readonly radicalKernBeforeDegree: MathValueRecord;
  readonly radicalKernAfterDegree: MathValueRecord;
  readonly radicalDegreeBottomRaisePercent: number; // int16
};

export type GlyphVariantRecord = {
  readonly variantGlyph: number; // Glyph ID
  readonly advanceMeasurement: number; // UFWORD (uint16 in design units)
};

export type GlyphPartRecord = {
  readonly glyphID: number; // uint16
  readonly startConnectorLength: number; // UFWORD (uint16 in design units)
  readonly endConnectorLength: number; // UFWORD (uint16 in design units)
  readonly fullAdvance: number; // UFWORD (uint16 in design units)
  readonly partsFlags: number; // uint16
};

export type GlyphAssembly = {
  readonly italicsCorrection: MathValueRecord;
  readonly partRecords: readonly GlyphPartRecord[];
};

export type GlyphConstruction = {
  readonly glyphAssembly: GlyphAssembly | null;
  readonly mathGlyphVariantRecords: readonly GlyphVariantRecord[];
};

export type MathVariants = {
  readonly minConnectorOverlap: number; // UFWORD (uint16 in design units)
  readonly vertGlyphCoverageOffset: number; // Offset16 (uint16)
  readonly horizGlyphCoverageOffset: number; // Offset16 (uint16)
  readonly vertGlyphCount: number; // uint16
  readonly horizGlyphCount: number; // uint16
  readonly getVertGlyphConstruction: (
    glyphID: number,
  ) => GlyphConstruction | null;
  readonly getHorizGlyphConstruction: (
    glyphID: number,
  ) => GlyphConstruction | null;
};
