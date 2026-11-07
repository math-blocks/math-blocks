## GitHub issues

- When creating issues with `gh`, do not escape strings or backticks in the Markdown body. `gh` passes the body through as-is, and escaping produces literal backslashes in the rendered issue.
- Always set an issue type on a new issue. The repo has three: `Bug`, `Feature`, and `Task`. Pass it with `gh issue create --type <name>`.
  - `Bug` — a package does the wrong thing on valid input, crashes, or renders, parses, or solves something incorrectly.
  - `Feature` — new user-facing capability, such as a new editor interaction, a new kind of expression, or a new solver operation.
  - `Task` — internal engineering work with no change to behavior. Refactors, renames, cleanups, performance work, tests, docs, dependency bumps, and milestone plumbing.
