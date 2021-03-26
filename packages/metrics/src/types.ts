export type GlyphMetrics = {
    advance: number;
    bearingX: number;
    bearingY: number;
    width: number;
    height: number;
};

export type FontMetrics = {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    getGlyphMetrics: (codePoint: number | undefined) => GlyphMetrics | null;
    hasChar: (char: string) => boolean;
};

/**
 * Source: https://docs.microsoft.com/en-us/typography/opentype/spec/math#mathconstants-table
 */
export type MathConstants = {
    /**
     * Percentage of scaling down for level 1 superscripts and subscripts.
     *
     * Suggested value: 80%.
     */
    scriptPercentScaleDown: number;

    /**
     * Percentage of scaling down for level 2 (scriptScript) superscripts and
     * subscripts.
     *
     * Suggested value: 60%.
     */
    scriptScriptPercentScaleDown: number;

    /**
     * Minimum height required for a delimited expression (contained within
     * parentheses, etc.) to be treated as a sub-formula.
     *
     * Suggested value: normal line height × 1.5.
     */
    delimitedSubFormulaMinHeight: number;

    /**
     * Minimum height of n-ary operators (such as integral and summation) for
     * formulas in display mode (that is, appearing as standalone page elements,
     * not embedded inline within text).
     */
    displayOperatorMinHeight: number;

    /**
     * The following properties should be MathValueRecords which can have an
     * optional offset into a table with corrections for the value at certain
     * resolutions
     */

    /**
     * White space to be left between math formulas to ensure proper line
     * spacing. For example, for applications that treat line gap as a part of
     * line ascender, formulas with ink going above
     * (os2.sTypoAscender + os2.sTypoLineGap - MathLeading) or with ink going
     * below os2.sTypoDescender will result in increasing line height.
     */
    mathLeading: number;

    /**
     * Axis height of the font.
     *
     * In math typesetting, the term axis refers to a horizontal reference line
     * used for positioning elements in a formula. The math axis is similar to
     * but distinct from the baseline for regular text layout. For example, in
     * a simple equation, a minus symbol or fraction rule would be on the axis,
     * but a string for a variable name would be set on a baseline that is
     * offset from the axis. The axisHeight value determines the amount of that
     * offset.
     */
    axisHeight: number;

    /**
     * Maximum (ink) height of accent base that does not require raising the
     * accents. Suggested: x‑height of the font (os2.sxHeight) plus any possible
     * overshots.
     */
    accentBaseHeight: number;

    /**
     * The standard shift down applied to subscript elements. Positive for
     * moving in the downward direction. Suggested: os2.ySubscriptYOffset.
     */
    flattenedAccentBaseHeight: number;

    /**
     * The standard shift down applied to subscript elements. Positive for
     * moving in the downward direction. Suggested: os2.ySubscriptYOffset.
     */
    subscriptShiftDown: number;

    /**
     * Maximum allowed height of the (ink) top of subscripts that does not
     * require moving subscripts further down. Suggested: 4/5 x- height.
     */
    subscriptTopMax: number;

    /**
     * Minimum allowed drop of the baseline of subscripts relative to the (ink)
     * bottom of the base. Checked for bases that are treated as a box or
     * extended shape. Positive for subscript baseline dropped below the base
     * bottom.
     */
    subscriptBaselineDropMin: number;

    /**
     * Standard shift up applied to superscript elements.
     *
     * Suggested: os2.ySuperscriptYOffset.
     */
    superscriptShiftUp: number;

    /**
     * Standard shift of superscripts relative to the base, in cramped style.
     */
    superscriptShiftUpCramped: number;

    /**
     * Minimum allowed height of the (ink) bottom of superscripts that does not
     * require moving subscripts further up.
     *
     * Suggested: ¼ x-height.
     */
    superscriptBottomMin: number;

    /**
     * Maximum allowed drop of the baseline of superscripts relative to the
     * (ink) top of the base. Checked for bases that are treated as a box or
     * extended shape. Positive for superscript baseline below the base top.
     */
    superscriptBaselineDropMax: number;

    /**
     * Minimum gap between the superscript and subscript ink.
     *
     * Suggested: 4 × default rule thickness.
     */
    subSuperscriptGapMin: number;

    /**
     * The maximum level to which the (ink) bottom of superscript can be pushed
     * to increase the gap between superscript and subscript, before subscript
     * starts being moved down.
     *
     * Suggested: 4/5 x-height.
     */
    superscriptBottomMaxWithSubscript: number;

    /**
     * Extra white space to be added after each subscript and superscript.
     *
     * Suggested: 0.5 pt for a 12 pt font.
     *
     * (Note that, in some math layout implementations, a constant value, such
     * as 0.5 pt, may be used for all text sizes. Some implementations may use
     * a constant ratio of text size, such as 1/24 of em.)
     */
    spaceAfterScript: number;

    /**
     * Minimum gap between the (ink) bottom of the upper limit, and the (ink)
     * top of the base operator.
     */
    upperLimitGapMin: number;

    /**
     * Minimum distance between baseline of upper limit and (ink) top of the
     * base operator.
     */
    upperLimitBaselineRiseMin: number;

    /**
     * Minimum gap between (ink) top of the lower limit, and (ink) bottom of
     * the base operator.
     */
    lowerLimitGapMin: number;

    /**
     * Minimum distance between baseline of the lower limit and (ink) bottom of
     * the base operator.
     */
    lowerLimitBaselineDropMin: number;

    /**
     * Standard shift up applied to the top element of a stack.
     */
    stackTopShiftUp: number;

    /**
     * Standard shift up applied to the top element of a stack in display style.
     */
    stackTopDisplayStyleShiftUp: number;

    /**
     * Standard shift down applied to the bottom element of a stack. Positive
     * for moving in the downward direction.
     */
    stackBottomShiftDown: number;

    /**
     * Standard shift down applied to the bottom element of a stack in display
     * style. Positive for moving in the downward direction.
     */
    stackBottomDisplayStyleShiftDown: number;

    /**
     * Minimum gap between (ink) bottom of the top element of a stack, and the
     * (ink) top of the bottom element.
     *
     * Suggested: 3 × default rule thickness.
     */
    stackGapMin: number;

    /**
     * Minimum gap between (ink) bottom of the top element of a stack, and the
     * (ink) top of the bottom element in display style.
     *
     * Suggested: 7 × default rule thickness.
     */
    stackDisplayStyleGapMin: number;

    /**
     * Standard shift up applied to the top element of the stretch stack.
     */
    stretchStackTopShiftUp: number;

    /**
     * Standard shift down applied to the bottom element of the stretch stack.
     * Positive for moving in the downward direction.
     */
    stretchStackBottomShiftDown: number;

    /**
     * Minimum gap between the ink of the stretched element, and the (ink)
     * bottom of the element above. Suggested: same value as upperLimitGapMin.
     */
    stretchStackGapAboveMin: number;

    /**
     * Minimum gap between the ink of the stretched element, and the (ink) top
     * of the element below. Suggested: same value as lowerLimitGapMin.
     */
    stretchStackGapBelowMin: number;

    /**
     * Standard shift up applied to the numerator.
     */
    fractionNumeratorShiftUp: number;

    /**
     * Standard shift up applied to the numerator in display style.
     *
     * Suggested: same value as stackTopDisplayStyleShiftUp.
     */
    fractionNumeratorDisplayStyleShiftUp: number;

    /**
     * Standard shift down applied to the denominator. Positive for moving in
     * the downward direction.
     */
    fractionDenominatorShiftDown: number;

    /**
     * Standard shift down applied to the denominator in display style.
     * Positivefor moving in the downward direction.
     *
     * Suggested: same value as stackBottomDisplayStyleShiftDown.
     */
    fractionDenominatorDisplayStyleShiftDown: number;

    /**
     * Minimum tolerated gap between the (ink) bottom of the numerator and the
     * ink of the fraction bar.
     *
     * Suggested: default rule thickness.
     */
    fractionNumeratorGapMin: number;

    /**
     * Minimum tolerated gap between the (ink) bottom of the numerator and the
     * ink of the fraction bar in display style.
     *
     * Suggested: 3 × default rule thickness.
     */
    fractionNumDisplayStyleGapMin: number;

    /**
     * Thickness of the fraction bar.
     *
     * Suggested: default rule thickness.
     */
    fractionRuleThickness: number;

    /**
     * Minimum tolerated gap between the (ink) top of the denominator and the
     * ink of the fraction bar.
     *
     * Suggested: default rule thickness.
     */
    fractionDenominatorGapMin: number;

    /**
     * Minimum tolerated gap between the (ink) top of the denominator and the
     * ink of the fraction bar in display style.
     *
     * Suggested: 3 × default rule thickness.
     */
    fractionDenomDisplayStyleGapMin: number;

    /**
     * Horizontal distance between the top and bottom elements of a skewed
     * fraction.
     */
    skewedFractionHorizontalGap: number;

    /**
     * Vertical distance between the ink of the top and bottom elements of a
     * skewed fraction.
     */
    skewedFractionVerticalGap: number;

    /**
     * Distance between the overbar and the (ink) top of he base.
     *
     * Suggested: 3 × default rule thickness.
     */
    overbarVerticalGap: number;

    /**
     * Thickness of overbar.
     *
     * Suggested: default rule thickness.
     */
    overbarRuleThickness: number;

    /**
     * Extra white space reserved above the overbar.
     *
     * Suggested: default rule thickness.
     */
    overbarExtraAscender: number;

    /**
     * Distance between underbar and (ink) bottom of the base.
     *
     * Suggested: 3 × default rule thickness.
     */
    underbarVerticalGap: number;

    /**
     * Thickness of underbar.
     *
     * Suggested: default rule thickness.
     */
    underbarRuleThickness: number;

    /**
     * Extra white space reserved below the underbar. Always positive.
     *
     * Suggested: default rule thickness.
     */
    underbarExtraDescender: number;

    /**
     * Space between the (ink) top of the expression and the bar over it.
     *
     * Suggested: 1¼ default rule thickness.
     */
    radicalVerticalGap: number;

    /**
     * Space between the (ink) top of the expression and the bar over it.
     *
     * Suggested: default rule thickness + ¼ x-height.
     */
    radicalDisplayStyleVerticalGap: number;

    /**
     * Thickness of the radical rule. This is the thickness of the rule in
     * designed or constructed radical signs.
     *
     * Suggested: default rule thickness.
     */
    radicalRuleThickness: number;

    /**
     * Extra white space reserved above the radical.
     *
     * Suggested: same value as radicalRuleThickness.
     */
    radicalExtraAscender: number;

    /**
     * Extra horizontal kern before the degree of a radical, if such is present.
     *
     * Suggested: 5/18 of em.
     */
    radicalKernBeforeDegree: number;

    /**
     * Negative kern after the degree of a radical, if such is present.
     *
     * Suggested: −10/18 of em.
     */
    radicalKernAfterDegree: number;

    /**
     * Height of the bottom of the radical degree, if such is present, in
     * proportion to the ascender of the radical sign.
     *
     * Suggested: 60%.
     */
    radicalDegreeBottomRaisePercent: number;
};

export type FontData = {
    fontMetrics: FontMetrics;
    fontFamily: string; // e.g. "Comic Sans", "STIX2", etc.
};
