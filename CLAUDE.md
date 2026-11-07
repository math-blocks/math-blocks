# math-blocks

math-blocks is a TypeScript monorepo of libraries and React components for building interactive math applications. The packages live under [packages/](packages/), and the demo app that exercises them lives under [demo/](demo/). Design notes are in [design/](design/).

## Responding in conversation

- Be concise. Lead with the direct answer, usually one or two sentences, and stop there.
- Don't pre-empt follow-up questions with extra sections, caveats, or trade-off surveys. The user will ask about anything they want expanded.
- Don't give a long version followed by a short recap. Give the short version.
- No multi-heading structure unless asked. This applies to analysis and planning questions too, not just quick lookups.

## Repo layout

- [packages/core/](packages/core/) — shared utility functions and types
- [packages/editor/](packages/editor/) — framework-independent editor tree, reducer, and editor-tree parser and printer
- [packages/parser/](packages/parser/) — `parserFactory` for building TDOP/Pratt parsers
- [packages/semantic/](packages/semantic/) — semantic AST types, node builders, and traversal helpers in `util.ts`
- [packages/solver/](packages/solver/) — step-by-step simplifying, solving, factoring, and differentiation that returns `Step` trees
- [packages/tex/](packages/tex/) — conversion between TeX and the editor tree
- [packages/typesetter/](packages/typesetter/) — converts editor trees to renderer-independent scene graphs
- [packages/opentype/](packages/opentype/) — parser for OpenType fonts with a MATH table
- [packages/react/](packages/react/) — React components for rendering and editing math
- [demo/](demo/) — Vite demo app, including the solver's step viewer in [demo/src/solver/](demo/src/solver/)

## Build & test

- Install: `yarn install --frozen-lockfile`
- Run all tests: `yarn test`. Run one package or file with `yarn jest <path>`, for example `yarn jest packages/solver`.
- Update snapshots: `yarn jest <path> -u`. Review every rewritten inline snapshot in the diff before committing.
- Lint: `yarn lint`
- Type-check: `yarn build-tsc`
- Type coverage: `yarn type-coverage`. CI fails below the 95% threshold in `package.json`.
- CI runs all of the above plus `yarn build-rollup`. A change is done when `yarn test`, `yarn lint`, and `yarn build-tsc` pass locally.
- A change to a published package needs a changeset. Run `yarn changeset`, pick the changed packages and bump type, and commit the generated file in [.changeset/](.changeset/). Changes to tests, the demo, or docs alone don't need one.

## Code conventions

- When traversing a semantic AST, use `traverse` or `traverseNumeric` from [packages/semantic/src/util.ts](packages/semantic/src/util.ts). Don't hand-roll a new traversal.
- Build semantic nodes with the builders in [packages/semantic/src/builders.ts](packages/semantic/src/builders.ts) rather than writing node object literals, so every node gets an `id`.
- Use `readonly` types for arrays and object fields. The `functional/prefer-readonly-type` lint rule enforces this.
- Name a function for what it produces or does, not for why a caller wants it. A name built from the reason goes stale as soon as a second caller needs the same operation for a different reason.
- Put the reason at the call site, not in the docstring. A docstring says what the function returns and what its parameters mean, so a reader deciding whether to call it needs nothing else. Why this call is the right one belongs in a comment above it, where the surrounding code gives it meaning.
- Keep in the docstring only what every caller needs: the contract, the shape of the return, and any ordering a caller has to respect. A constraint like "this must run before X" is contract, not rationale, so it stays.
- Avoid parentheticals in comments. Rewrite the aside as a plain sentence, fold it into the main clause, or drop it. Reserve parentheses for short, essential clarifications like a code reference or a concrete example.
- Write comments about what the code does now, not what it did before a change. Drop phrasing like "previously", "used to", "is now", "no longer", and "the old behavior", and don't make a PR number or milestone the subject of a sentence. Describe the current behavior and its rationale instead, and leave the history to git.

## Writing tests

- Write test inputs as math source parsed with the package's `parse` helper, and assert outputs with its `print` helper. See [packages/solver/src/test-util.ts](packages/solver/src/test-util.ts) and [packages/solver/src/simplify/\_\_tests\_\_/simplify.test.ts](packages/solver/src/simplify/__tests__/simplify.test.ts) for the canonical pattern.
- For solver steps, assert the list of substep messages with `toEqual` and the printed expressions with `toMatchInlineSnapshot`.
- When a test would otherwise need many drill-down assertions about a tree, print it and use `toMatchInlineSnapshot` instead. First-run flow: call `toMatchInlineSnapshot()` with no argument and run the test, and Jest writes the literal back into the test file. Reserve targeted `expect` checks for the one or two facts that aren't visible in the printed form.
- Assert the full error message, not a substring.
- Prefer `test.each` tables when several cases share one shape.

## Ephemeral scripts

When a one-off task needs more logic than a short shell pipeline, such as parsing JSON, multi-step text processing, scanning many files, or ad-hoc analysis, write a Node script in `/tmp/<name>.mjs` and run it with `node`. Prefer this over inline bash with awk/sed/jq chains or a Python script, because Node scripts are easier for the user to read and audit.

- Use ES modules (`.mjs`), top-level `await`, and the Node standard library (`node:fs`, `node:path`, `node:os`, etc.).
- Don't add npm dependencies for ephemeral work.
- Reach for bash only for genuinely shell-shaped tasks, such as one-line pipelines, file globs, and process control.

## GitHub issues

- When creating issues with `gh`, do not escape strings or backticks in the Markdown body. `gh` passes the body through as-is, and escaping produces literal backslashes in the rendered issue.
- Always set an issue type on a new issue. The repo has three: `Bug`, `Feature`, and `Task`. Pass it with `gh issue create --type <name>`.
  - `Bug` — a package does the wrong thing on valid input, crashes, or renders, parses, or solves something incorrectly.
  - `Feature` — new user-facing capability, such as a new editor interaction, a new kind of expression, or a new solver operation.
  - `Task` — internal engineering work with no change to behavior. Refactors, renames, cleanups, performance work, tests, docs, dependency bumps, and milestone plumbing.

## Pull requests

- When a PR addresses a specific GitHub issue, say so in the PR body. Put a line such as `Fixes #123` near the top of the summary, before the details of the change. Use `Fixes` when merging the PR resolves the issue and `Refs` when the PR is only part of the work.
- Name every issue the PR touches on its own line when there is more than one.

## Git cadence

- While iterating on a PR, commit locally but don't `git push` until I explicitly ask.
- Still push at the end of a session so nothing is lost.

## Writing agent-facing docs

This covers the files an agent reads to work here: `CLAUDE.md`, any skills under
`.claude/skills/`, and any reference file they point to. `CLAUDE.md` loads on
every turn, so treat its length as a running cost and keep only lines that change
what the agent does.

- State each rule once. When another section needs the same rule, link to the one
  place that states it. A rule copied into two spots drifts when one copy changes.
- Cut instructions that only restate a default. Spelling out behavior the agent
  already does spends tokens without changing the outcome.
- Inline what every task needs and push package-specific detail into a separate
  file, then point to that file. The repo-layout list does this: it names each
  package with a one-line gloss and a link instead of inlining the details.
  Word the pointer so it says what the file is and which cases it covers, since
  that wording is what prompts the agent to open it.
- Give each instruction a clear done condition. "A change is done when
  `yarn test`, `yarn lint`, and `yarn build-tsc` pass" marks when the step is
  finished; "make sure it builds" leaves the boundary vague.
- Prefer naming the action to take over the action to avoid. "Use the builders
  in `builders.ts`" points at the target directly, where "don't write node
  literals" only rules one path out. Keep a prohibition when the wrong path is
  the tempting one.

# Writing prose

The guidance in this section applies to every kind of prose you write: code
comments, docstrings, and the messages you write to the user in conversation.
Read each rule as covering all three. A few points are inherently code-specific,
such as backticking identifiers or sweeping a diff before committing. Those apply
wherever they make sense and are simply irrelevant elsewhere.

## Punctuation and sentence structure

- Use colons only for their standard jobs: introducing a list, a definition, or
  a direct elaboration that completes the clause before it. Do not use a colon
  mid-sentence to tack on an aside or a second thought. If you're tempted to
  write "X does Y: which means Z", rewrite it as two sentences or join with a
  conjunction.
- Don't use a colon where a comma, dash, or period would read more naturally.
  A colon makes the reader stop and expect a list or payoff; if none follows,
  it's jarring.
- Avoid parentheticals. They interrupt the sentence and force the reader to
  hold the main clause in mind while processing the aside. In almost every case
  one of these is better:
    - Cut the parenthetical entirely if it's not load-bearing.
    - Promote it to its own sentence if it matters.
    - Fold it into the sentence with a comma if it's short and essential.
- Never nest a parenthetical inside another, and never stack two parentheticals
  in one sentence.
- Don't use parentheses to define or gloss a term inline. Define it in the
  preceding or following sentence instead.
- Prefer short, complete sentences over long ones held together by dashes,
  semicolons, and asides. One idea per sentence.
- When explaining a process with multiple steps, lay the steps out as a list
  rather than stringing them through a paragraph. Use a numbered list when the
  order matters and a bulleted list when it doesn't. One step per item reads far
  more easily than steps joined by semicolons or "then ... then ...".
- Read each sentence as if a human has to parse it left to right with no
  rereading. If understanding it requires jumping back to an earlier clause,
  restructure it.
- In Markdown you write, such as PR descriptions, docs, and issue bodies, use
  sentence case for headings and keep decorative emoji out of them. Don't add an
  inline bold lead-in that just restates the sentence after it.

## Word choice and explaining code

- Define a technical or coined term the first time you use it. Terms like
  "like terms", "canonical form", or "e-graph" mean nothing to a reader who
  lacks your context. Give a one-line plain-language definition before you rely
  on the term, not after.
- Ground an abstract claim in a concrete example. When a comment cites specific
  output such as a printed expression or a list of step messages, include the
  input that produces it. The reader can then trace where the output comes from
  instead of taking it on faith.
- Use precise verbs. Replace vague verbs like "supplies", "handles", "drives",
  and "manages" with the actual action: produces, reads, returns, mutates,
  consults. A vague verb hides what the code does.
- Cut the stock phrases that pad machine-written text. They add length without
  adding information. Watch for these:
    - Filler openers and connectors: "additionally", "furthermore", "moreover",
      "in order to", "due to the fact that", "it is worth noting that", "it is
      important to note that". Delete them or start with the point.
    - Puffery and inflated verbs: "crucial", "pivotal", "seamless", "robust",
      "powerful", "leverage", "utilize", "delve", "underscore", "showcase".
      Prefer the plain word. Write "use" not "utilize", "important" not
      "crucial", "shows" not "showcases".
    - Filler copulas where a plain "is" or a precise verb reads better: "serves
      as", "stands as", "acts as", "boasts", "features".
    - The "not just X, but Y" construction, and groups of three forced for
      rhythm. State the one thing that matters.
    - Vague "-ing" tails bolted onto a clause: "..., ensuring correctness",
      "..., highlighting the issue", "..., allowing reuse". Make the fact its
      own sentence or drop it.
    - Hedges that soften a claim you can state flatly: "generally", "typically",
      "in most cases", when the code always does the thing.
- Don't inject personality to compensate for cutting those phrases. A comment or
  doc wants flat, precise description, not a lively voice, editorial opinions, or
  first-person asides. Cut the tell and stop. Plain is the goal, not colorful.
- Name the value, not the technique that produced it. Don't write "the
  traversal" when you mean the tree it returned, or "the reducer" when you mean
  the new editor state. Refer to the thing the code hands around.
- Say what a test asserts, not what it "pins". Write "the test asserts that
  `<clause>`" for a single check, "covers" for the range of cases a table walks,
  and "exercises" for a scenario the test drives. Reserve "pin" for a version
  or revision held fixed. "asserts that" needs a full clause where "pins" took a
  noun phrase, so reshape the sentence around the verb instead of swapping the
  word in place.
- Backtick a word that carries both an ordinary meaning and a specialized one,
  whenever the specialized one is intended. Without the backticks a reader
  parses the sentence as plain prose and has to start over on reaching the code.
  "returns the step before and after" reads as a claim about time.
  "returns the step's `before` and `after`" names the two fields. This covers
  node types and fields such as `Add`, `Mul`, `Neg`, `Number`, `before`,
  `after`, and `substeps`, and any identifier whose name is itself a common
  word, such as `simplify`, `apply`, or `path`. Backtick only the specialized
  sense. "simplify the comment" and "add a test" stay bare, because there the
  ordinary meaning is the intended one. Apply this when reviewing a comment as
  well as when writing one.
- Treat any prose you write as draft-then-revise, not one-shot. After writing
  anything longer than a sentence or two, whether a comment, a docstring, or a
  reply to the user, reread it as someone with no prior context. Fix every
  unexplained term and every sentence that needs a second pass. On that reread,
  scan for the stock phrases listed above and cut any that slipped in. Do the
  same sweep over the comments in a diff before committing.
