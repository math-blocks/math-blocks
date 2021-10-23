import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';

import { FontDataContext } from './font-data-context';
import SceneRenderer from './scene-renderer';

const { useContext } = React;

type Props = {
  // The initial value for the editor
  readonly row?: Editor.types.CharRow;
  readonly zipper?: Editor.Zipper;
  readonly fontSize?: number;
  readonly showCursor?: boolean;
  readonly radicalDegreeAlgorithm?: Typesetter.RadicalDegreeAlgorithm;
  readonly mathStyle?: Typesetter.MathStyle;
  readonly renderMode?: Typesetter.RenderMode;

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
    } = props;

    const context: Typesetter.Context = {
      fontData: fontData,
      baseFontSize: fontSize,
      mathStyle: mathStyle,
      cramped: false,
      renderMode: renderMode,
      radicalDegreeAlgorithm: props.radicalDegreeAlgorithm,
    };

    const options = { showCursor: props.showCursor, debug: true };

    const scene = (() => {
      if (props.row) {
        return Typesetter.typeset(props.row, context, options);
      } else if (props.zipper) {
        return Typesetter.typesetZipper(props.zipper, context, options);
      } else {
        return null;
      }
    })();

    if (scene == null) {
      return null;
    }

    return (
      <SceneRenderer
        ref={ref}
        scene={scene}
        showHitboxes={showHitboxes}
        style={style}
      />
    );
  },
);

MathRenderer.displayName = 'MathRenderer';

export default MathRenderer;
