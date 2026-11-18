import { build } from 'esbuild';
import { buildExtension, common, languageOptions } from './build-extension.mjs';

const language = process.argv[2] ?? 'en';

await Promise.all([
  buildExtension(language, 'out'),
  build({ ...common, ...languageOptions(language), entryPoints: ['test/domain.test.ts', 'test/browser.test.ts'], platform: 'node',
    target: 'node22', external: ['playwright-core'], outdir: '.test-dist', outExtension: { '.js': '.cjs' } }),
]);
