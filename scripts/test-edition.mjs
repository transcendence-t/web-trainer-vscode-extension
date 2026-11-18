import { execFileSync } from 'node:child_process';

const language = process.argv[2] ?? 'en';
execFileSync(process.execPath, ['scripts/build.mjs', language], { stdio: 'inherit' });
execFileSync(process.execPath, ['--test', '.test-dist/domain.test.cjs', '.test-dist/browser.test.cjs'],
  { stdio: 'inherit' });
