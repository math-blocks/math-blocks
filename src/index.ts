import {Expression} from "./ast";
import print from "./print";

const ast: Expression = {
    kind: "add",
    args: [
        {
            kind: "number",
            value: "1.23",
        },
        {
            kind: "identifier",
            name: "x",
        }
    ]
};

console.log(print(ast));
