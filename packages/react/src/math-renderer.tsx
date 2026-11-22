import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';
import { macros } from '@math-blocks/tex';

import { useFontData } from './font-data-context';
import { useMissingGlyphs } from './use-missing-glyphs';
import SceneRenderer from './scene-renderer';

const operators = Object.keys(macros).filter((key) => key === macros[key]);

type Props = {
  readonly row: Editor.types.CharRow;
  readonly fontSize?: number;
  readonly showCursor?: boolean;
  readonly radicalDegreeAlgorithm?: Typesetter.RadicalDegreeAlgorithm;
  readonly mathStyle?: Typesetter.MathStyle;
  readonly renderMode?: Typesetter.RenderMode;
  readonly selection?: Editor.Selection;

  // Style
  readonly style?: React.CSSProperties;

  // Renders bounding boxes around each group and glyph.
  readonly showHitboxes?: boolean;

  // Called, after rendering, for each character the font can't draw (for
  // example because its glyph group isn't loaded), which is drawn as a
  // placeholder instead. `group` is set when the character's glyph group isn't
  // loaded. It's called again only when the set of missing characters changes.
  readonly onMissingGlyph?: (char: string, group: string | undefined) => void;
};

// TODO: expose other settings such as display style as props
// TODO: add an onBlur prop
export const MathRenderer = React.forwardRef<SVGSVGElement, Props>(
  (props, ref) => {
    const fontData = useFontData('MathRenderer');
    const onMissingGlyph = useMissingGlyphs(props.onMissingGlyph);
    const {
      style,
      fontSize = 64,
      showHitboxes,
      mathStyle = Typesetter.MathStyle.Display,
      renderMode = Typesetter.RenderMode.Static,
      selection,
    } = props;

    const context: Typesetter.Context = {
      fontData: fontData,
      baseFontSize: fontSize,
      mathStyle: mathStyle,
      cramped: false,
      renderMode: renderMode,
      radicalDegreeAlgorithm: props.radicalDegreeAlgorithm,
      selection: selection,
      operators: operators,
      onMissingGlyph,
    };

    const options = { showCursor: props.showCursor, debug: true };

    const scene = Typesetter.typeset(props.row, context, options);

    const { depth } = scene.content.bounds;

    let verticalAlign = -Math.floor(depth);
    if (verticalAlign < 0) {
      verticalAlign = -Math.ceil(depth);
    }

    return (
      <SceneRenderer
        ref={ref}
        scene={scene}
        showHitboxes={showHitboxes}
        style={{
          ...style,
          verticalAlign,
        }}
      />
    );
  },
);

MathRenderer.displayName = 'MathRenderer';

export default MathRenderer;
