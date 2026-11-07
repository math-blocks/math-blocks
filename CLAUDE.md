## GitHub issues

- When creating issues with `gh`, do not escape strings or backticks in the Markdown body. `gh` passes the body through as-is, and escaping produces literal backslashes in the rendered issue.
- Always set an issue type on a new issue. The repo has three: `Bug`, `Feature`, and `Task`. Pass it with `gh issue create --type <name>`.
  - `Bug` — a package does the wrong thing on valid input, crashes, or renders, parses, or solves something incorrectly.
  - `Feature` — new user-facing capability, such as a new editor interaction, a new kind of expression, or a new solver operation.
  - `Task` — internal engineering work with no change to behavior. Refactors, renames, cleanups, performance work, tests, docs, dependency bumps, and milestone plumbing.

## Changesets

- Add a changeset (a Markdown file in `.changeset/`) when a PR changes what a package exports. That includes adding, removing, or changing an export, and changing an existing export so that it uses new code.
- Don't add one when the new code isn't exported and no existing export uses it yet. The package's public API hasn't changed, so there's nothing to release. Say so in the PR description, because the changeset bot will report "No Changeset found".
- Pick the bump level from the most significant change to that package. All packages are still below 1.0, so breaking changes bump `minor`, not `major`:
  - `patch` — backward-compatible changes: new exports, new features, and bug fixes. For example, adding a `print` function to `@math-blocks/tex`.
  - `minor` — breaking changes to an export: removing or renaming it, or changing its arguments, return type, or behavior in a way existing callers would notice. For example, `@math-blocks/tex` exporting a `parse` function instead of the `Parser` class.
  - `major` — don't use it. It's reserved for a package's 1.0 release, which is the maintainer's call.
- When a PR changes the exports of several packages, give each package its own changeset with its own bump level.
