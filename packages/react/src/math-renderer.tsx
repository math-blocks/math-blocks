import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';
import { macros } from '@math-blocks/tex';

import { useFontData } from './font-data-context';
import { useMissingGlyphs } from './use-missing-glyphs';
import SceneRenderer from './scene-renderer';
import { HiddenMathml } from './editor-mathml';
import { useRendererSelection } from './use-renderer-selection';

const operators = Object.keys(macros).filter((key) => key === macros[key]);

type Props = {
  readonly row: Editor.types.CharRow;
  readonly fontSize?: number;
  readonly showCursor?: boolean;
  readonly radicalDegreeAlgorithm?: Typesetter.RadicalDegreeAlgorithm;
  readonly mathStyle?: Typesetter.MathStyle;
  readonly renderMode?: Typesetter.RenderMode;
  // Draws this selection, in place of any the user makes.
  readonly selection?: Editor.Selection;

  // Whether the user can select the math by dragging across it. Defaults to
  // true. Turn it off for math that's decorative or part of a control.
  readonly selectable?: boolean;

  // Style
  readonly style?: React.CSSProperties;

  // Renders bounding boxes around each group and glyph.
  readonly showHitboxes?: boolean;

  // Called, after rendering, for each character the font can't draw (for
  // example because its glyph group isn't loaded), which is drawn as a
  // placeholder instead. `group` is set when the character's glyph group isn't
  // loaded. It's called again only when the set of missing characters changes.
  readonly onMissingGlyph?: (char: string, group: string | undefined) => void;

  // Hides the math from screen readers entirely, for example when it's
  // decorative or the page already provides its own accessible alternative.
  // The hidden MathML is then left out.
  readonly 'aria-hidden'?: boolean;
};

// TODO: expose other settings such as display style as props
// TODO: add an onBlur prop
export const MathRenderer = React.forwardRef<SVGSVGElement, Props>(
  (props, ref) => {
    const fontData = useFontData('MathRenderer');
    const recordMissingGlyph = useMissingGlyphs(props.onMissingGlyph);
    const {
      style,
      fontSize = 64,
      showHitboxes,
      mathStyle = Typesetter.MathStyle.Display,
      renderMode = Typesetter.RenderMode.Static,
      selectable = true,
    } = props;

    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const setSvgRef = React.useCallback(
      (svg: SVGSVGElement | null): void => {
        svgRef.current = svg;
        if (typeof ref === 'function') {
          ref(svg);
        } else if (ref) {
          ref.current = svg;
        }
      },
      [ref],
    );

    const userSelection = useRendererSelection({
      row: props.row,
      selectable,
      svgRef,
      getScene: () => scene,
      display: mathStyle === Typesetter.MathStyle.Display ? 'block' : 'inline',
    });
    const selection = props.selection ?? userSelection.selection;

    const context: Typesetter.Context = {
      fontData: fontData,
      baseFontSize: fontSize,
      mathStyle: mathStyle,
      cramped: false,
      renderMode: renderMode,
      radicalDegreeAlgorithm: props.radicalDegreeAlgorithm,
      selection: selection,
      operators: operators,
      recordMissingGlyph,
    };

    const options = { showCursor: props.showCursor, debug: true };

    const scene = Typesetter.typeset(props.row, context, options);

    const { depth } = scene.content.bounds;

    let verticalAlign = -Math.floor(depth);
    if (verticalAlign < 0) {
      verticalAlign = -Math.ceil(depth);
    }

    // Screen readers read the math from Presentation MathML that's rendered
    // next to the SVG but hidden visually. The SVG is only a picture of the
    // math, so it's hidden from them, and the math isn't read twice.
    return (
      <>
        <SceneRenderer
          ref={setSvgRef}
          scene={scene}
          showHitboxes={showHitboxes}
          accessibilityHidden={true}
          onMouseDown={userSelection.onMouseDown}
          style={{
            ...style,
            verticalAlign,
          }}
        />
        {!props['aria-hidden'] && (
          <HiddenMathml
            row={props.row}
            display={
              mathStyle === Typesetter.MathStyle.Display ? 'block' : 'inline'
            }
          />
        )}
      </>
    );
  },
);

MathRenderer.displayName = 'MathRenderer';

export default MathRenderer;
