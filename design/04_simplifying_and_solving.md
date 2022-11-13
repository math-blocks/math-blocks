# 04 Simplifying and Solving

Being able to simplify expressions and solve equations is an important building
block for creating interactive math applications.

Computer Algebra Systems (CAS for short) have been around for quite sometime.
These systems are focused on providing the solution as quickly as possible.
They don't always use the same algorithms a human would and they don't provide
the intermediate steps in their solutions. Due to these shortcomings, Math
Blocks implements its solver in a very different way.

The system currently only supports solving linear equations.  The equations can
be arbitrarily complex.  If the equation contains multiple variables, then the
solution will contain the variables not being solved for.  Equations are solved
using the following high-level steps:

- Simplify each side
  - Get rid of any parentheses (my multiplying them out)
  - Collect like terms
- Isolate the variable being solved for
  - Move terms containing that variable to one side and all other terms to the
    other side
  - Simplify each side again
  - If the variable we're solving for still has a coeffecient, divide both side
    by the coefficient

Each step includes a description of the change being made.  Each step can have
substeps which can in turn have additional sub-steps.  This information can be
provided to a user via progressive disclosure allowing us to target users with
differing skills and abilities.

## Future Work

- Handle more types of equations: quadratic equations, systems of equations,
  rational expressions, etc.
  - Some of these will require augmenting the semantic tree to handle things
    like mulitple solutions and solutions with different domains
- Option to use vertical layouts where appropriate
- Ability to highlight the changes within the larger expression/equation by
  changing the color of symbols involved in the change
- Introduce enums for tracking each change in a consistent way
