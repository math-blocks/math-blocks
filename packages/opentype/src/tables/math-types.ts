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
  readonly mathLeading: number;
  readonly axisHeight: number;
  readonly accentBaseHeight: number;
  readonly flattenedAccentBaseHeight: number;
  readonly subscriptShiftDown: number;
  readonly subscriptTopMax: number;
  readonly subscriptBaselineDropMin: number;
  readonly superscriptShiftUp: number;
  readonly superscriptShiftUpCramped: number;
  readonly superscriptBottomMin: number;
  readonly superscriptBaselineDropMax: number;
  readonly subSuperscriptGapMin: number;
  readonly superscriptBottomMaxWithSubscript: number;
  readonly spaceAfterScript: number;
  readonly upperLimitGapMin: number;
  readonly upperLimitBaselineRiseMin: number;
  readonly lowerLimitGapMin: number;
  readonly lowerLimitBaselineDropMin: number;
  readonly stackTopShiftUp: number;
  readonly stackTopDisplayStyleShiftUp: number;
  readonly stackBottomShiftDown: number;
  readonly stackBottomDisplayStyleShiftDown: number;
  readonly stackGapMin: number;
  readonly stackDisplayStyleGapMin: number;
  readonly stretchStackTopShiftUp: number;
  readonly stretchStackBottomShiftDown: number;
  readonly stretchStackGapAboveMin: number;
  readonly stretchStackGapBelowMin: number;
  readonly fractionNumeratorShiftUp: number;
  readonly fractionNumeratorDisplayStyleShiftUp: number;
  readonly fractionDenominatorShiftDown: number;
  readonly fractionDenominatorDisplayStyleShiftDown: number;
  readonly fractionNumeratorGapMin: number;
  readonly fractionNumDisplayStyleGapMin: number;
  readonly fractionRuleThickness: number;
  readonly fractionDenominatorGapMin: number;
  readonly fractionDenomDisplayStyleGapMin: number;
  readonly skewedFractionHorizontalGap: number;
  readonly skewedFractionVerticalGap: number;
  readonly overbarVerticalGap: number;
  readonly overbarRuleThickness: number;
  readonly overbarExtraAscender: number;
  readonly underbarVerticalGap: number;
  readonly underbarRuleThickness: number;
  readonly underbarExtraDescender: number;
  readonly radicalVerticalGap: number;
  readonly radicalDisplayStyleVerticalGap: number;
  readonly radicalRuleThickness: number;
  readonly radicalExtraAscender: number;
  readonly radicalKernBeforeDegree: number;
  readonly radicalKernAfterDegree: number;
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
