/**
 * esbuild bundling script for mirra-cc-bridge Claude Code plugin
 *
 * Produces standalone JS bundles in scripts/ that include all npm dependencies.
 * Each entry point gets its own bundle so hooks load fast (~200KB) while the
 * server carries heavier deps (~350KB).
 *
 * node-pty is marked external since it's a native module. The existing try/catch
 * fallback in session-manager.ts handles its absence gracefully.
 */

import * as esbuild from 'esbuild';
import { rmSync, mkdirSync } from 'fs';

// Clean output directory
try {
  rmSync('scripts', { recursive: true, force: true });
} catch {
  // Ignore if doesn't exist
}
mkdirSync('scripts', { recursive: true });

const entryPoints = {
  'hook-handler': 'src/entrypoints/hook-handler.ts',
  'server': 'src/entrypoints/server.ts',
  'configure': 'src/entrypoints/configure.ts',
  'status': 'src/entrypoints/status.ts',
};

const sharedConfig = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: false,
  minify: false,
  // node-pty is a native module that can't be bundled; session-manager.ts
  // already has a try/catch fallback when it's not available
  external: ['node-pty'],
};

async function build() {
  const results = [];

  for (const [name, entryPoint] of Object.entries(entryPoints)) {
    console.log(`Building ${name}...`);

    const result = await esbuild.build({
      ...sharedConfig,
      entryPoints: [entryPoint],
      outfile: `scripts/${name}.js`,
    });

    if (result.errors.length > 0) {
      console.error(`Errors building ${name}:`, result.errors);
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.warn(`Warnings for ${name}:`, result.warnings);
    }

    results.push({ name, result });
  }

  console.log('\nBuild complete:');
  for (const { name } of results) {
    console.log(`  scripts/${name}.js`);
  }
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
