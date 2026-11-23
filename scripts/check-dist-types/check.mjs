// Typechecks consumer.ts against every package's built dist/ declarations
// with skipLibCheck off, under moduleResolution "bundler" and "node16". This
// catches published types that reference names they don't declare or import,
// such as ambient globals that only exist inside the repo (see #810).
//
// Run `pnpm build` first.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(here, '../../packages');
const scopeDir = path.join(here, 'node_modules', '@math-blocks');

// Link each package into ./node_modules so consumer.ts resolves it through
// its package.json "exports", like an installed dependency.
fs.rmSync(scopeDir, { recursive: true, force: true });
fs.mkdirSync(scopeDir, { recursive: true });

for (const name of fs.readdirSync(packagesDir)) {
  const pkgDir = path.join(packagesDir, name);
  if (!fs.existsSync(path.join(pkgDir, 'package.json'))) {
    continue;
  }
  if (!fs.existsSync(path.join(pkgDir, 'dist'))) {
    console.error(`${pkgDir}/dist doesn't exist. Run \`pnpm build\` first.`);
    process.exit(1);
  }
  fs.symlinkSync(pkgDir, path.join(scopeDir, name), 'junction');
}

// Find tsc through typescript's package.json "bin" field. TypeScript 7's
// "exports" doesn't expose bin/tsc, so it can't be resolved directly.
const tsPackageJson = createRequire(import.meta.url).resolve(
  'typescript/package.json',
);
const { bin } = JSON.parse(fs.readFileSync(tsPackageJson, 'utf8'));
const tsc = path.resolve(path.dirname(tsPackageJson), bin.tsc);
let failed = false;

for (const config of ['tsconfig.bundler.json', 'tsconfig.node16.json']) {
  console.log(`Checking dist types with ${config}`);
  const result = spawnSync(
    process.execPath,
    [tsc, '-p', path.join(here, config)],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
