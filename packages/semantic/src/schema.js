const stringLiteral = (value) => {
    return {
        type: "string",
        enum: [value],
    };
};

const ref = (name) => ({
    $ref: `#/definitions/${name}`,
});

const object = (properties, options) => {
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

const node = (name, properties = {}, options) => {
    return {
        type: "object",
        allOf: [
            ref("Node"),
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

const nary = (name, argType) =>
    node(name, {
        args: {
            type: "array",
            items: argType,
            minItems: 2,
        },
    });

const binary = (name, argType) =>
    node(name, {
        args: {
            type: "array",
            items: [argType, argType],
            minItems: 2,
            maxItems: 2,
        },
    });

const unary = (name, argType) =>
    node(name, {
        arg: argType,
    });

// json-schema-to-typescript doesn't support using refs at the top level so
// we instead make a ref that points to the top-level and use it everywhere
// we need to.
const Expression = {$ref: "#"};

const NumericExpression = ref("NumericExpression");
const LogicExpression = ref("LogicExpression");
const SetExpression = ref("SetExpression");

// TODO: create a schema generator so that we can produce two schemas:
// - one that distinguishes between different types of expressions
// - one that uses Expression for everything to facilitate parsing

const genSchema = ({NumericExpression, LogicExpression, SetExpression}) => {
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

            Node: object(
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
                    subscript: NumericExpression,
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
            Add: nary("add", NumericExpression),
            Mul: node("mul", {
                args: {
                    type: "array",
                    items: NumericExpression,
                    minItems: 2,
                },
                implicit: {type: "boolean"},
            }),
            Func: node("func", {
                // We want to limit this to identifiers and expression of identifiers
                // e.g. h(x) = (f + g)(x) = f(x) + g(x) = ...
                func: NumericExpression,
                // There's a special case when each of the args is a variable then it
                // could be a variable definition
                args: {
                    type: "array",
                    items: NumericExpression,
                },
            }),

            // I'm not sure how useful having a special node for this is given
            // we'll have a separate table for looking up the value of variables,
            // constants, and other things that can be defined include functions
            // type FuncDef = {
            //     type: "funcdef",
            //     func: Expression | Expression,
            //     bvars: Identifier[],
            //     value: Expression,
            // }

            // f(x, y) = 2x + y
            // criteria:
            // - each arg to the function must be an identifier
            // - must be part of an equation
            // - rhs must be something that can be evaluated so f(x, y) = 2x + y - z
            //   would only count if z's value was previously defined
            // given a statement like this we can derive a deeper semantic meaning
            // from the separate parts

            Div: binary("div", NumericExpression),
            Mod: binary("mod", NumericExpression),
            Root: node("root", {
                radicand: NumericExpression,
                index: NumericExpression,
            }),
            Exp: node("exp", {base: NumericExpression, exp: NumericExpression}),
            Log: node("log", {base: NumericExpression, arg: NumericExpression}),
            Neg: node("neg", {
                arg: NumericExpression,
                subtraction: {type: "boolean"},
            }),
            Abs: unary("abs", NumericExpression),
            // TODO: think about how to define other types of bounds, e.g. sets
            Limits: binary("limits", NumericExpression), // [lower, upper] bounds
            Sum: node("sum", {
                arg: NumericExpression,
                bvar: ref("Ident"),
                limits: ref("Limits"),
            }),
            Prod: node("prod", {
                arg: NumericExpression,
                bvar: ref("Ident"),
                limits: ref("Limits"),
            }),
            Limit: node("lim", {
                arg: NumericExpression,
                bvar: ref("Ident"),
                target: NumericExpression,
            }),
            // TODO: figure out how to handle degress
            Diff: unary("diff", NumericExpression),
            // TODO: add an 'arg' to PDiff
            PDiff: binary("pdiff", NumericExpression), // [numerator, denominator]
            // TODO: think about multiple integrals
            Int: node("int", {
                arg: NumericExpression,
                bvar: ref("Ident"),
                limits: ref("Ident"),
            }),

            // TODO
            // - Complex numbers
            // - Round, Ceil, Floor, etc.

            NumericExpression: {
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

            Eq: nary("eq", Expression),
            Neq: nary("neq", Expression),
            Lt: nary("lt", NumericExpression),
            Lte: nary("lte", NumericExpression),
            Gt: nary("gt", NumericExpression),
            Gte: nary("gte", NumericExpression),
            And: nary("and", LogicExpression),
            Or: nary("or", LogicExpression),
            Xor: nary("xor", LogicExpression),
            Not: unary("not", LogicExpression),
            Implies: binary("implies", LogicExpression),
            Iff: binary("iff", LogicExpression),
            True: node("true"),
            False: node("false"),
            Subset: nary("subset", SetExpression),
            ProperSubset: nary("prsubset", SetExpression),
            NotSubset: nary("notsubset", SetExpression),
            NotProperSubset: nary("notprsubset", SetExpression),
            In: node("in", {element: Expression, set: SetExpression}),
            NotIn: node("notin", {element: Expression, set: SetExpression}),

            LogicExpression: {
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
            //     arg: Expression,
            // };

            // type Existential = {
            //     type: "exist",
            //     bvar: Identifier,
            //     arg: Expression,
            // };

            // type Predicate = {
            // };

            // TODO: handle things like { x^2 | x ∈ ℕ } and stuff like that
            Set: node("set", {
                args: {
                    type: "array",
                    items: Expression, // could also include shapes, strings, images, etc.
                },
            }),

            EmptySet: node("empty"),
            Union: nary("union", SetExpression),
            Intersection: nary("intersection", SetExpression),
            SetDiff: binary("setdiff", SetExpression),
            CartesianProduct: nary("cartesian_product", SetExpression),

            Naturals: node("naturals"),
            Integers: node("integers"),
            Rationals: node("rationals"),
            Reals: node("reals"),
            Complexes: node("complexes"),

            SetExpression: {
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
        anyOf: [
            ref("NumericExpression"),
            ref("LogicExpression"),
            ref("SetExpression"),
        ],
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
exports.parsingSchema = genSchema({
    NumericExpression: Expression,
    LogicExpression: Expression,
    SetExpression: Expression,
});

// After parse we can validate it and the cast the data structure to this the
// types produced from this schema.
exports.validationSchema = genSchema({
    NumericExpression,
    LogicExpression,
    SetExpression,
});
