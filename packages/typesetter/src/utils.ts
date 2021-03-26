import {MathStyle} from "./enums";

import {constants} from "./math-constants";

// TODO: in the future pass in constants as an arg as well
export const multiplierForMathStyle = (mathStyle: MathStyle): number => {
    switch (mathStyle) {
        case MathStyle.Display:
        case MathStyle.Text:
            return 1.0;
        case MathStyle.Script:
            return constants.scriptPercentScaleDown / 100;
        case MathStyle.ScriptScript:
            return constants.scriptScriptPercentScaleDown / 100;
    }
};
