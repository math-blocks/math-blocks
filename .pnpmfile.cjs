// Some tools load TypeScript as a library through its JavaScript API, which
// TypeScript 7.0 doesn't ship. Give them their own TypeScript 6 while the repo
// itself uses TypeScript 7:
//
// - type-coverage-core: the `type-coverage` CI job. Supports TypeScript 7.1's
//   API, so it can come off this list once the repo is on 7.1.
// - typedoc: the API docs (typedoc.json). Doesn't support TypeScript 7 yet.
// - @swc-node/register: runs packages/semantic/src/codegen.ts, and reads the
//   tsconfig with the TypeScript API.
//
// typescript is a peer dependency of these packages, so pnpm would resolve it
// to the repo's TypeScript 7, and neither `overrides` nor `packageExtensions`
// changes that. Turn the peer dependency into a regular one instead.
const USE_TYPESCRIPT_6 = new Set([
  'type-coverage-core',
  'typedoc',
  '@swc-node/register',
]);

function readPackage(pkg) {
  if (USE_TYPESCRIPT_6.has(pkg.name)) {
    if (pkg.peerDependencies) {
      delete pkg.peerDependencies.typescript;
    }
    pkg.dependencies = {
      ...pkg.dependencies,
      typescript: 'npm:typescript@^6',
    };
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
