import * as React from "react";

import {MathmlRenderer, MathRenderer} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";
import {typeset} from "@math-blocks/typesetter";
import {FontMetricsContext} from "@math-blocks/metrics";

type Props = {
    math: Editor.types.Row;
};

const AccessibleMath: React.FC<Props> = (props) => {
    const {math} = props;

    const fontMetrics = React.useContext(FontMetricsContext);

    const fontSize = 64;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: undefined,
    };

    const options = {showCursor: false};

    const scene = typeset(math, context, options);
    const node = Editor.parse(math);
    console.log(node);

    const mathRef = React.useRef<SVGSVGElement>(null);
    const mathmlRef = React.useRef<HTMLElement>(null);

    const [transform, setTransform] = React.useState<string>("scale(1, 1)");

    React.useEffect(() => {
        if (mathRef.current && mathmlRef.current) {
            const svg = mathRef.current;
            const math = mathmlRef.current;

            const svgBounds = svg.getBoundingClientRect();
            const mathBounds = math.getBoundingClientRect();

            // TODO: grab the bounds from the scene graph instead, then we don't
            // need to use ref shenanigans.
            const scaleX = svgBounds.width / mathBounds.width;
            const scaleY = svgBounds.height / mathBounds.height;

            setTransform(`scale(${scaleX}, ${scaleY})`);
        }
    }, [mathRef, mathmlRef]);

    const DEBUG = false;

    return (
        <div style={{position: "relative"}}>
            <MathRenderer scene={scene} ref={mathRef} />
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    opacity: DEBUG ? 0.25 : 1.0,
                    transformOrigin: "left top",
                    transform: transform,
                }}
            >
                <MathmlRenderer
                    math={node}
                    style={{
                        fontSize: 60,
                        opacity: DEBUG ? 1.0 : 0.0,
                        fontFamily: "Comic Sans MS",
                    }}
                    ref={mathmlRef}
                />
            </div>
        </div>
    );
};

export default AccessibleMath;
