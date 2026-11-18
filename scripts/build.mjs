import { build } from 'esbuild';

const common = { bundle: true, legalComments: 'none', charset: 'utf8' };

await Promise.all([
  build({ ...common, entryPoints: ['src/extension.ts'], platform: 'node', target: 'node20',
    external: ['vscode'], outfile: 'out/extension.js' }),
  build({ ...common, entryPoints: ['src/ui.ts', 'src/runner.ts'], platform: 'browser', target: 'chrome120',
    format: 'iife', outdir: 'out' }),
  build({ ...common, entryPoints: ['test/domain.test.ts', 'test/browser.test.ts'], platform: 'node',
    target: 'node22', external: ['playwright-core'], outdir: '.test-dist', outExtension: { '.js': '.cjs' } }),
]);
