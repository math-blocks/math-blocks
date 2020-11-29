import {JSONSchema7, JSONSchema7Definition} from "json-schema";

const stringLiteral = (value: string): JSONSchema7 => {
    return {
        type: "string",
        enum: [value],
    };
};

const ref = (name: string): JSONSchema7 => ({
    $ref: `#/definitions/${name}`,
});

type Options = {optional?: string[]};
type Properties = {
    [key: string]: JSONSchema7Definition;
};

const object = (properties: Properties, options?: Options): JSONSchema7 => {
    const optional = (options && options.optional) || [];

    const required = Object.keys(properties).filter(
        (key) => !optional.includes(key),
    );

    return {
        type: "object",
        properties,
        required,
    };
};

const node = (
    name: string,
    properties: object = {},
    options?: Options,
): object => {
    return {
        type: "object",
        allOf: [
            ref("Common"),
            object(
                {
                    type: stringLiteral(name),
                    ...properties,
                },
                options,
            ),
        ],
    };
};

const nary = (name: string, argType: JSONSchema7): object =>
    node(name, {
        args: {
            type: "array",
            items: argType,
            minItems: 2,
        },
    });

const binary = (name: string, argType: JSONSchema7): object =>
    node(name, {
        args: {
            type: "array",
            items: [argType, argType],
            minItems: 2,
            maxItems: 2,
        },
    });

const unary = (name: string, argType: JSONSchema7): object =>
    node(name, {
        arg: argType,
    });

// json-schema-to-typescript doesn't support using refs at the top level so
// we instead make a ref that points to the top-level and use it everywhere
// we need to.
const Node = {$ref: "#"};

const NumericNode = ref("NumericNode");
const LogicNode = ref("LogicNode");
const SetNode = ref("SetNode");

// TODO: create a schema generator so that we can produce two schemas:
// - one that distinguishes between different types of expressions
// - one that uses Node for everything to facilitate parsing

type SchemaArg = {
    NumericNode: JSONSchema7;
    LogicNode: JSONSchema7;
    SetNode: JSONSchema7;
};

const genSchema = ({
    NumericNode,
    LogicNode,
    SetNode,
}: SchemaArg): JSONSchema7 => {
    return {
        $schema: "http://json-schema.org/draft-07/schema#",
        definitions: {
            // TODO: set `additionalProperties: false` on Locaiton
            Location: object({
                path: {
                    type: "array",
                    items: {type: "number"},
                },
                start: {type: "number"},
                end: {type: "number"},
            }),

            Common: object(
                {
                    id: {type: "number"},
                    loc: ref("Location"),
                },
                {optional: ["loc"]},
            ),

            Ident: node(
                "identifier",
                {
                    // TODO: use a regex to restrict this to valid identifiers
                    name: {type: "string"},
                    subscript: NumericNode,
                    // TODO: units
                    // It's possible that variables could have units associated
                    // with them as well it seems like a bit of an edge case
                    // though.
                },
                {optional: ["subscript"]},
            ),
            Num: node("number", {
                // TODO: figure out how to model `Value extends string = string`?
                // TODO: use a regex to restrict this to valid numbers
                value: {type: "string"},
                // TODO: unit
                // without 'unit', the number is considered dimensionless
            }),
            Infinity: node("infinity"),
            Pi: node("pi"),
            Ellipsis: node("ellipsis"),
            Add: nary("add", NumericNode),
            Mul: node("mul", {
                args: {
                    type: "array",
                    items: NumericNode,
                    minItems: 2,
                },
                implicit: {type: "boolean"},
            }),
            Func: node("func", {
                // We want to limit this to identifiers and expression of identifiers
                // e.g. h(x) = (f + g)(x) = f(x) + g(x) = ...
                func: NumericNode,
                // There's a special case when each of the args is a variable then it
                // could be a variable definition
                args: {
                    type: "array",
                    items: NumericNode,
                },
            }),

            // I'm not sure how useful having a special node for this is given
            // we'll have a separate table for looking up the value of variables,
            // constants, and other things that can be defined include functions
            // type FuncDef = {
            //     type: "funcdef",
            //     func: Node | Node,
            //     bvars: Identifier[],
            //     value: Node,
            // }

            // f(x, y) = 2x + y
            // criteria:
            // - each arg to the function must be an identifier
            // - must be part of an equation
            // - rhs must be something that can be evaluated so f(x, y) = 2x + y - z
            //   would only count if z's value was previously defined
            // given a statement like this we can derive a deeper semantic meaning
            // from the separate parts

            Div: binary("div", NumericNode),
            Mod: binary("mod", NumericNode),
            Root: node("root", {
                radicand: NumericNode,
                index: NumericNode,
            }),
            Exp: node("exp", {base: NumericNode, exp: NumericNode}),
            Log: node("log", {base: NumericNode, arg: NumericNode}),
            Neg: node("neg", {
                arg: NumericNode,
                subtraction: {type: "boolean"},
            }),
            Abs: unary("abs", NumericNode),
            // TODO: think about how to define other types of bounds, e.g. sets
            Limits: binary("limits", NumericNode), // [lower, upper] bounds
            Sum: node("sum", {
                arg: NumericNode,
                bvar: ref("Ident"),
                limits: ref("Limits"),
            }),
            Prod: node("prod", {
                arg: NumericNode,
                bvar: ref("Ident"),
                limits: ref("Limits"),
            }),
            Limit: node("lim", {
                arg: NumericNode,
                bvar: ref("Ident"),
                target: NumericNode,
            }),
            // TODO: figure out how to handle degress
            Diff: unary("diff", NumericNode),
            // TODO: add an 'arg' to PDiff
            PDiff: binary("pdiff", NumericNode), // [numerator, denominator]
            // TODO: think about multiple integrals
            Int: node("int", {
                arg: NumericNode,
                bvar: ref("Ident"),
                limits: ref("Ident"),
            }),

            // TODO
            // - Complex numbers
            // - Round, Ceil, Floor, etc.

            NumericNode: {
                oneOf: [
                    ref("Num"),
                    ref("Infinity"),
                    ref("Pi"),
                    ref("Ident"),
                    ref("Ellipsis"),

                    // n-ary
                    ref("Add"),
                    ref("Mul"),
                    ref("Func"),

                    // binary
                    ref("Div"),
                    ref("Mod"),
                    ref("Root"),
                    ref("Exp"),
                    ref("Log"),

                    // unary
                    ref("Neg"),
                    ref("Abs"),
                    ref("Sum"),
                    ref("Prod"),
                    ref("Limit"),
                    ref("Diff"),
                    ref("PDiff"),
                    ref("Int"),
                ],
            },

            Eq: nary("eq", Node),
            Neq: nary("neq", Node),
            Lt: nary("lt", NumericNode),
            Lte: nary("lte", NumericNode),
            Gt: nary("gt", NumericNode),
            Gte: nary("gte", NumericNode),
            And: nary("and", LogicNode),
            Or: nary("or", LogicNode),
            Xor: nary("xor", LogicNode),
            Not: unary("not", LogicNode),
            Implies: binary("implies", LogicNode),
            Iff: binary("iff", LogicNode),
            True: node("true"),
            False: node("false"),
            Subset: nary("subset", SetNode),
            ProperSubset: nary("prsubset", SetNode),
            NotSubset: nary("notsubset", SetNode),
            NotProperSubset: nary("notprsubset", SetNode),
            In: node("in", {element: Node, set: SetNode}),
            NotIn: node("notin", {element: Node, set: SetNode}),

            LogicNode: {
                oneOf: [
                    ref("Ident"),

                    // values
                    ref("True"),
                    ref("False"),

                    // operations
                    ref("And"), // conjunction
                    ref("Or"), // disjunction
                    ref("Not"),
                    ref("Xor"),
                    ref("Implies"),
                    ref("Iff"),

                    // numeric relations
                    ref("Eq"),
                    ref("Neq"),
                    ref("Lt"),
                    ref("Lte"),
                    ref("Gt"),
                    ref("Gte"),

                    // set relations
                    ref("In"),
                    ref("NotIn"),
                    ref("Subset"),
                    ref("ProperSubset"),
                    ref("NotSubset"),
                    ref("NotProperSubset"),
                ],
            },

            // TODO: Predicate Logic

            // type Universal = {
            //     type: "univ",
            //     bvar: Identifier,
            //     arg: Node,
            // };

            // type Existential = {
            //     type: "exist",
            //     bvar: Identifier,
            //     arg: Node,
            // };

            // type Predicate = {
            // };

            // TODO: handle things like { x^2 | x ∈ ℕ } and stuff like that
            Set: node("set", {
                args: {
                    type: "array",
                    items: Node, // could also include shapes, strings, images, etc.
                },
            }),

            EmptySet: node("empty"),
            Union: nary("union", SetNode),
            Intersection: nary("intersection", SetNode),
            SetDiff: binary("setdiff", SetNode),
            CartesianProduct: nary("cartesian_product", SetNode),

            Naturals: node("naturals"),
            Integers: node("integers"),
            Rationals: node("rationals"),
            Reals: node("reals"),
            Complexes: node("complexes"),

            SetNode: {
                oneOf: [
                    ref("Ident"),
                    ref("Set"),
                    ref("EmptySet"),

                    // set operations
                    ref("Union"),
                    ref("Intersection"),
                    ref("SetDiff"),
                    ref("CartesianProduct"),

                    // number sets
                    ref("Naturals"),
                    ref("Integers"),
                    ref("Rationals"),
                    ref("Reals"),
                    ref("Complexes"),
                ],
            },

            // TODO: vectors and matrices

            // TODO: geometry (2D, 3D)
            // - Point
            // - Line
            // - Ray
            // - Polygon (Quadrilateral, Trapezoid, Parallelogram, Rhombus, Square, Triangle)
            //   - Polygon-type-opedia
            // - Circle
            // - Ellipse
            // - Parallel
            // - Perpendicular
            // - Congruent, Similiar
            // - transforms: Scale, Rotate, Translate, Skew
        },

        type: "object",

        // We use anyOf here to support Ident appear in each of the expression
        // types below.
        anyOf: [ref("NumericNode"), ref("LogicNode"), ref("SetNode")],
    };
};

// Evaluation
// - when evaluating, we have to consider the scope of a variable, e.g.
//   the x inside an integral is bound to dx which maps to the start/end
//   of the interval of integration, but there might be a different x
//   outside of the integral with a different value
// - conversely if there's a y in the expression being integrated but
//   there's no dy then y grabs its value from the closest wrapping scope
// - NOTE: scope and binding is yet another thing that isn't explicitly
//   taught in math education but probably should

// Parsing is easier if all the nodes that the parser produces are the same.
export const parsingSchema = genSchema({
    NumericNode: Node,
    LogicNode: Node,
    SetNode: Node,
});

// After parse we can validate it and the cast the data structure to this the
// types produced from this schema.
export const semanticSchema = genSchema({
    NumericNode,
    LogicNode,
    SetNode,
});
