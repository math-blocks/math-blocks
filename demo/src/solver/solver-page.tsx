import * as React from "react";

import * as Editor from "@math-blocks/editor-core";
import {MathEditor, MathRenderer, FontDataContext} from "@math-blocks/react";
import {builders} from "@math-blocks/semantic";
import {simplify, solve} from "@math-blocks/solver";
import {Step} from "@math-blocks/step-utils";
import * as Typesetter from "@math-blocks/typesetter";
import {getFontData, parse} from "@math-blocks/opentype";
import type {Font} from "@math-blocks/opentype";

import Substeps from "./substeps";

const question: Editor.types.Row = Editor.util.row("2x+5=10");
const questionZipper: Editor.Zipper = {
    breadcrumbs: [],
    row: {
        id: question.id,
        type: "zrow",
        left: [],
        selection: null,
        right: question.children,
    },
};

// TODO:
// - show error messages in the UI
// - provide a UI disclosing sub-steps
// - use the colorMap option to highlight related nodes between steps
//   e.g. 2(x + y) -> 2x + 2y the 2s would be the same color, etc.
// - update MathRenderer to do the typesetting

const SolverPage: React.FunctionComponent = () => {
    const [input, setInput] = React.useState<Editor.Zipper>(questionZipper);
    const [solution, setSolution] = React.useState<Editor.types.Row | null>(
        null,
    );
    const [step, setStep] = React.useState<Step | null>(null);

    const handleSimplify = (): void => {
        console.log("SIMPLIFY");
        const ast = Editor.parse(Editor.zipperToRow(input));
        const result = simplify(ast, []);
        if (result) {
            console.log(result);
            const solution = Editor.print(result.after);
            console.log(solution);
            setSolution(solution);
            setStep(result);
        } else {
            console.log("no solution found");
        }
    };

    const handleSolve = (): void => {
        console.log("SOLVE");
        const ast = Editor.parse(Editor.zipperToRow(input));
        if (ast.type === "eq") {
            const result = solve(ast, builders.identifier("x"));
            if (result) {
                console.log(result);
                const solution = Editor.print(result.after);
                console.log(solution);
                setSolution(solution);
                setStep(result);
            } else {
                console.log("no solution found");
            }
        } else {
            console.warn("can't solve something that isn't an equation");
        }
    };

    const [font, setFont] = React.useState<Font | null>(null);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/STIX2Math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setFont(font);
        };

        loadFont();
    }, []);

    if (!font) {
        return null;
    }

    const fontSize = 64;
    const context: Typesetter.Context = {
        fontData: getFontData(font, "STIX2"),
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
        // colorMap: props.colorMap,
    };

    const maybeRenderSolution = (): React.ReactNode => {
        if (solution != null) {
            const scene = Typesetter.typeset(solution, context);
            return <MathRenderer scene={scene} />;
        }
        return null;
    };

    const showSolution = solution != null;

    return (
        <FontDataContext.Provider value={context.fontData}>
            <div style={styles.container}>
                <div>
                    <div style={styles.label}>Question:</div>
                    <button onClick={handleSimplify}>Simplify</button>
                    <button onClick={handleSolve}>Solve</button>
                </div>
                <div>
                    <MathEditor
                        readonly={false}
                        zipper={input}
                        stepChecker={true}
                        focus={true}
                        onChange={(value: Editor.Zipper) => setInput(value)}
                    />
                </div>
                <div style={styles.gap}></div>
                <div style={styles.gap}></div>
                {showSolution && <div style={styles.label}>Steps:</div>}
                {showSolution && step && (
                    <Substeps start={step.before} step={step} />
                )}
                {showSolution && <div style={styles.label}>Answer:</div>}
                {showSolution && maybeRenderSolution()}
            </div>
        </FontDataContext.Provider>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: "grid",
        gridTemplateColumns: "200px auto",
    },
    label: {
        paddingTop: 16,
        fontSize: 32,
        fontFamily: "sans-serif",
    },
    gap: {
        height: 32,
    },
};

export default SolverPage;
