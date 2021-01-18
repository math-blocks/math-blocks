import * as React from "react";

import * as Editor from "@math-blocks/editor-core";
import fontMetrics from "@math-blocks/metrics";
import {MathRenderer} from "@math-blocks/react";
import {types} from "@math-blocks/semantic";
import {Step, applyStep} from "@math-blocks/solver";
import {typeset} from "@math-blocks/typesetter";

type Props = {
    // Prefix to start numbering from, e.g. 1.2.3
    prefix?: string;

    // The starting expression to render the substeps from `step` with.
    start: types.Node;

    step: Step;
};

const Substeps: React.FunctionComponent<Props> = ({prefix, start, step}) => {
    let current = start;

    const fontSize = 64;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        // colorMap: props.colorMap,
    };

    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            {step.substeps.map((substep, index) => {
                const before = current;

                const after = applyStep(before, substep);
                const afterScene = typeset(Editor.print(after), context);

                current = after;

                const num = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;

                return (
                    <React.Fragment key={index + 1}>
                        <div>
                            {num}: {substep.message}
                        </div>
                        {/* TODO: special case substeps.length === 1 */}
                        {substep.substeps.length > 0 && (
                            <div style={{paddingLeft: 64}}>
                                <Substeps
                                    prefix={num}
                                    start={before}
                                    step={substep}
                                />
                            </div>
                        )}
                        {substep.substeps.length === 0 && (
                            <MathRenderer
                                scene={afterScene}
                                style={{marginBottom: 32}}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default Substeps;
