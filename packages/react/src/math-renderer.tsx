import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';
import { macros } from '@math-blocks/tex';

import { FontDataContext } from './font-data-context';
import SceneRenderer from './scene-renderer';

const { useContext } = React;

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
};

// TODO: expose other settings such as display style as props
// TODO: add an onBlur prop
export const MathRenderer = React.forwardRef<SVGSVGElement, Props>(
  (props, ref) => {
    const fontData = useContext(FontDataContext);
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
    };

    const options = { showCursor: props.showCursor, debug: true };

    const scene = Typesetter.typeset(props.row, context, options);

    const { depth } = scene.content.bounds;

    return (
      <SceneRenderer
        ref={ref}
        scene={scene}
        showHitboxes={showHitboxes}
        style={{
          ...style,
          verticalAlign: -Math.floor(depth),
        }}
      />
    );
  },
);

MathRenderer.displayName = 'MathRenderer';

export default MathRenderer;
