---
name: pr-review
description: Review a pull request's diff for correctness bugs, cleanup, and CLAUDE.md violations, and post each finding as an inline comment on the PR. The summary also lists functions moved with trivial changes and the high-risk changes a human should check. The `code-review` job in .github/workflows/code-review.yml runs it when k4b7 comments `/code-review [low|medium|high]` on a PR. Use it in any session that is asked to review a PR and post the findings on GitHub.
---

# pr-review

The prompt that runs this skill gives the repository, the PR number, and a level of `low`, `medium`, or `high`. Use `medium` when no level is given.

## Levels

| Level | Angles to run | Findings to post at most |
|---|---|---|
| `low` | A | 3 |
| `medium` | A, B, C, Conventions | 6 |
| `high` | All eight | 10 |

At `low`, post only findings you are confident are real. At `high`, aim for recall. Post a finding whenever you can name a concrete failure scenario, even when you are not sure it is real.

## 1. Gather the diff

1. Run `gh pr view <number> --json baseRefName,headRefOid,files` to find the base branch and head commit. The base may be another stacked PR branch, not `main`.
2. Run `gh pr diff <number>` to get the unified diff. This diff is the review scope.
3. The PR branch is checked out in the working directory. Read changed files from there to see the code around each hunk.

## 2. Find candidates

Run each angle the level calls for. Each angle produces up to 6 candidates, each with a file, a line, a one-line summary, and a concrete failure scenario.

- **A. Line-by-line scan.** Read every hunk, then the whole function that encloses it. Bugs in unchanged lines of a touched function are in scope. For each line, ask what input, state, or ordering makes it wrong: an inverted condition, an off-by-one, an `undefined` or `null` access, a missing case in a `switch` over a node type, the wrong variable, a swallowed error.
- **B. Removed behavior.** For each line the diff deletes or replaces, name the invariant it enforced. Then find where the new code enforces it. If nothing does, that is a candidate: a dropped guard, a lost error path, a narrowed check, or a deleted test that covered a real case.
- **C. Cross-file trace.** For each function the diff changes, grep for its callers. Check whether the change breaks a call site through a new precondition, a changed return shape, or an ordering dependency.
- **Reuse.** Flag new code that duplicates a helper the codebase already has, and name the helper.
- **Simplification.** Flag complexity the diff adds that a simpler form would replace: derivable state, near-copies, dead code. Name the simpler form.
- **Efficiency.** Flag wasted work the diff adds, such as repeated computation or work on a hot path that could be skipped. Name the cheaper alternative.
- **Altitude.** Flag a fix that patches a symptom with a special case where a change to the underlying mechanism would be simpler and more general. Name that change.
- **Conventions.** Read the repo-root `CLAUDE.md` and any `CLAUDE.md` in a directory above a changed file. Flag a violation only when you can quote both the rule and the line that breaks it.

For cleanup, altitude, and conventions findings, the failure scenario states the cost instead of a crash.

## 3. Dedup and rank

Merge candidates that describe the same defect at the same place. Then give each finding a severity:

| Severity | Marker | Meaning |
|---|---|---|
| High | 🔴 | Fix before merging. The failure scenario is likely on real input, or the defect is unsound, crashes, or loses data. |
| Medium | 🟠 | A real bug, but its failure needs an unusual input or ordering. |
| Low | 🟡 | Cleanup that is optional: reuse, simplification, efficiency, altitude, or conventions. |

Rank by severity, then correctness bugs before cleanup within the same severity. When the cap forces a cut, drop the lowest severity first.

## 4. Map moved code

Run this step at every level. A moved function is one the diff deletes from one place and adds in another, in the same file or a different one. Find candidates with `git diff --color-moved=plain --color-moved-ws=allow-indentation-change origin/<base>...HEAD`, then compare each deleted body with its added counterpart.

A move is trivial when the only differences are these:

- Parameters, locals, or the function itself are renamed.
- A method becomes a function, or a function becomes a method, with the receiver moved to or from the parameter list.
- Imports, package qualifiers, comments, or formatting change.

Record each trivial move as the old location, the new location, and the changes in one short phrase, such as "renamed `t` to `table`" or "method on `Parser` became a function taking `parser: Parser`". A move that changes behavior is not trivial. Leave it out of this list and review its differences like any other change. Don't post findings about code a trivial move carries over unchanged, since the move did not introduce it.

## 5. Flag high-risk changes

Run this step at every level. A high-risk change is one where a mistake is costly or easy to miss, whether or not you found a bug in it. Flag a change when it does one of these:

- It loosens a check in `packages/solver/`, so a transform fires on input it skipped before or a solve step is reported as valid when it wasn't. Removing a guard, widening when a rule matches, or adding an early return before a check all count.
- It deletes or disables a test, or changes an expected snapshot under `__snapshots__/` or an inline expected value, so that wrong output now passes.
- It changes shared infrastructure that many packages read, such as the node definitions and builders in `packages/semantic/src/` (`types.ts`, `node-defs.ts`, `builders.ts`), the editor's shared types in `packages/editor/src/shared-types.ts`, or the scene graph in `packages/typesetter/src/scene-graph.ts`.
- It changes `.github/workflows/`, permissions, secrets, release config under `.changeset/`, or anything else that runs with repository credentials or publishes packages.
- It replaces binary or generated data in bulk, such as the fonts under `assets/` or most of `yarn.lock`.

For each one, record the file, the range of changed lines that makes it risky, and a one-line statement of what a human reviewer should confirm. Take the range from the diff hunk that holds the change. Use new-file line numbers for added or changed lines, and old-file numbers for lines the PR only deletes. When a change spans several hunks of one file, record the hunk that matters most and name the others in the statement. Keep the list to the changes that most need a second look, at most 5.

## 6. Post

1. List the inline comments an earlier review already posted:

   ```bash
   gh api repos/<repo>/pulls/<number>/comments --paginate \
     --jq '.[] | select(.user.login == "claude[bot]") | {path, line, body}'
   ```

   Skip a finding when one of these comments is on the same file and describes the same defect. Its line may have moved since then, so match by the defect, not the line number.
2. For each remaining finding, check that its line falls inside a diff hunk on the new side. Post it with `mcp__github_inline_comment__create_inline_comment` and `confirmed: true`. The body starts with the severity marker, then a bold one-line summary and its category, then gives the failure scenario. For example: `🔴 **IsSuperset tests the subset relation** (correctness)`.
3. When a finding's line is outside every hunk, attach it to the nearest changed line it concerns and name the real line in the body.
4. Last, write the summary. Its first line is the marker `<!-- pr-review-summary -->`, and the next line names the head commit reviewed. After that come three sections, each with a sentence-case heading:
   - **Findings:** each finding of this run on one line, starting with its severity marker, with its file and line, including the ones skipped in item 1. Mark a skipped one as already posted. When nothing survives, say that the review found no issues.
   - **Moved code:** each trivial move from step 4 on one line. Leave the section out when there are none.
   - **Needs human review:** each high-risk change from step 5 on one line, linked to its range of lines. Leave the section out when there are none.

   Write each file a line names as a link to that file's changes in the PR. GitHub's anchor for a file is `diff-` followed by the SHA-256 of its path. Get the hash with `printf '%s' '<path>' | sha256sum`, then write the link as:

   ```markdown
   [`<path>:<line>`](https://github.com/<repo>/pull/<number>/files#diff-<hash>R<line>)
   ```

   `R<line>` points at a line of the new file. Leave off `R<line>` when the entry names no line, and use `L<line>` for a line that exists only in the old file, such as the old location of a moved function.

   An entry that names a range of lines links to the whole range, which GitHub highlights. Give both ends the same side:

   ```markdown
   [`<path>:<start>-<end>`](https://github.com/<repo>/pull/<number>/files#diff-<hash>R<start>-R<end>)
   ```

   Use `L<start>-L<end>` for a range of deleted lines.
5. Post the summary in place of any earlier one. List the ids of the comments that carry the marker, oldest first:

   ```bash
   gh api repos/<repo>/issues/<number>/comments --paginate \
     --jq '.[] | select(.body | contains("<!-- pr-review-summary -->")) | .id'
   ```

   The earlier summary is the last id it prints. The lookup matches on the marker alone, so it finds the summary whichever account posted it.

   Write the summary with the Write tool to `.pr-review-summary.md` in the working directory, then pass that file to `gh`. Keep the summary text out of the command line. The job refuses a command whose arguments contain text that looks like shell syntax, and a summary that quotes code often does. It also refuses writes outside the working directory.

   When that prints an id, replace that comment's body:

   ```bash
   gh api -X PATCH repos/<repo>/issues/comments/<id> -F body=@.pr-review-summary.md
   ```

   When it prints nothing, or the edit fails because another account owns that comment, post a new comment:

   ```bash
   gh pr comment <number> --body-file .pr-review-summary.md
   ```

Keep every comment short and plain, and follow any prose rules in `CLAUDE.md`. Don't send the review as a chat message, since only GitHub comments reach the PR.
