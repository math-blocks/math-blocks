import * as React from "react";

import * as Editor from "@math-blocks/editor";
import {parse} from "@math-blocks/editor-parser";
import fontMetrics from "@math-blocks/metrics";
import {MathEditor, MathRenderer} from "@math-blocks/react";
import {builders} from "@math-blocks/semantic";
import {simplify, solve} from "@math-blocks/solver";
import * as Typesetter from "@math-blocks/typesetter";

const question: Editor.Row = Editor.Util.row("2x+5=10");

// TODO:
// - show the solution below
// - show error messages in the UI
// - show all of the steps and sub-steps
// - provide a UI disclosing sub-steps
// - use the colorMap option to highlight related nodes between steps
//   e.g. 2(x + y) -> 2x + 2y the 2s would be the same color, etc.
// - 2x + 4y - x + -y -> x + (3)(y) ... should be x + 3y
// - update MathRenderer to do the typesetting

const SolverPage: React.FunctionComponent = () => {
    const [input, setInput] = React.useState(question);
    const [solution, setSolution] = React.useState<Editor.Node | null>(null);

    const handleSimplify = (): void => {
        console.log("SIMPLIFY");
        const ast = parse(input);
        const result = simplify(ast, []);
        if (result) {
            console.log(result);
            const solution = Editor.print(result.after);
            console.log(solution);
            setSolution(solution);
        } else {
            console.log("no solution found");
        }
    };

    const handleSolve = (): void => {
        console.log("SOLVE");
        const ast = parse(input);
        if (ast.type === "eq") {
            const result = solve(ast, builders.identifier("x"));
            if (result) {
                console.log(result);
                const solution = Editor.print(result.after);
                console.log(solution);
                setSolution(solution);
            } else {
                console.log("no solution found");
            }
        } else {
            console.warn("can't solve something that isn't an equation");
        }
    };

    const fontSize = 64;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        // colorMap: props.colorMap,
    };

    const maybeRenderSolution = (): React.ReactNode => {
        if (solution != null) {
            const box = Typesetter.typeset(
                solution,
                context,
            ) as Typesetter.Layout.Box;
            return (
                <MathRenderer box={box} cursor={undefined} cancelRegions={[]} />
            );
        }
        return null;
    };

    return (
        <div>
            <MathEditor
                readonly={false}
                rows={[input]}
                stepChecker={true}
                focus={true}
                style={{marginTop: 8}}
                onChange={(value: Editor.Row) => setInput(value)}
            />
            <button onClick={handleSimplify}>Simplify</button>
            <button onClick={handleSolve}>Solve</button>
            {maybeRenderSolution()}
        </div>
    );
};

export default SolverPage;
