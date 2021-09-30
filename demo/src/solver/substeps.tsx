import * as React from "react";

import * as Editor from "@math-blocks/editor";
import * as Semantic from "@math-blocks/semantic";
import * as Solver from "@math-blocks/solver";
import * as Typesetter from "@math-blocks/typesetter";
import {MathRenderer, FontDataContext} from "@math-blocks/react";

type Props = {
    // Prefix to start numbering from, e.g. 1.2.3
    readonly prefix?: string;

    // The starting expression to render the substeps from `step` with.
    readonly start: Semantic.types.Node;

    readonly step: Solver.Step;
};

const Substeps: React.FunctionComponent<Props> = ({prefix, start, step}) => {
    const fontData = React.useContext(FontDataContext);

    let current = start;

    const fontSize = 64;
    const context: Typesetter.Context = {
        fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
        // colorMap: props.colorMap,
    };

    const beforeRow = Editor.print(step.before);
    const beforeScene = Typesetter.typeset(beforeRow, context);

    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            <MathRenderer scene={beforeScene} style={{marginBottom: 32}} />
            {step.substeps.map((substep, index) => {
                const before = current;

                const after = Solver.applyStep(before, substep);
                const afterRow = Editor.print(substep.after);
                const afterScene = Typesetter.typeset(afterRow, context);

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
                        {
                            <MathRenderer
                                scene={afterScene}
                                style={{marginBottom: 32}}
                            />
                        }
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default Substeps;
