export enum NodeType {
    // Numeric Node Types
    Number = "number",
    Identifier = "Identifier",
    Add = "add",
    Mul = "mul",
    Neg = "neg",
    PlusMinus = "plusminus",
    MinusPlus = "minusplus",
    Div = "div",
    Mod = "mod",
    Root = "root",
    Pow = "pow",
    Log = "log",
    Func = "func",
    Infinity = "infinity",
    Pi = "pi",
    Ellipsis = "ellipsis",
    Abs = "abs",
    Parens = "Parens",
    Sum = "Sum",
    Product = "Product",
    Limit = "Limit",
    Derivative = "Derivative",
    PartialDerivative = "PartialDerivative",
    Integral = "Integral",
    VerticalAdditionToRelation = "VerticalAdditionToRelation",
    SystemOfRelationsElimination = "SystemOfRelationsElimination",
    LongAddition = "LongAddition",
    LongSubtraction = "LongSubtraction",
    LongMultiplication = "LongMultiplication",
    LongDivision = "LongDivision",

    // Logic Node Types
    True = "true",
    False = "false",
    And = "and", // rename to Conjunction
    Or = "or", // rename to Disjunction
    Not = "not", // rename to LogicalInverse
    Xor = "xor",
    Implies = "implies",
    Iff = "iff",
    Eq = "eq", // Equals
    Neq = "neq", // NotEquals
    Lt = "lt", // LessThan
    Lte = "lte", // LessThanOrEquals
    Gt = "gt", // GreaterThan
    Gte = "gte", // GreaterThanOrEquals

    // Set Node Types
    In = "in",
    NotIn = "notin",
    Subset = "subset",
    ProperSubset = "prsubset",
    NotSubset = "notsubset",
    NotProperSubset = "notprsubset",
    Set = "set",
    EmptySet = "empty",
    Union = "union",
    Intersection = "intersection", // rename to SetIntersection
    SetDiff = "setdiff", // rename to SetDifference
    CartesianProduct = "cartesian_product",
    Naturals = "naturals",
    Integers = "integers",
    Rationals = "rationals",
    Reals = "reals",
    Complexes = "complexes",
}
