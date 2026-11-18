import { build } from 'esbuild';

export const editions = { en: 'web-foundations', 'zh-cn': 'web-foundations-zh-cn' };
export const common = { bundle: true, legalComments: 'none', charset: 'utf8' };

export function languageOptions(language) {
  if (!Object.hasOwn(editions, language)) throw new Error(`Unknown edition: ${language}`);
  return { define: { __WEB_TRAINER_LANGUAGE__: JSON.stringify(language) } };
}

export async function buildExtension(language, outdir) {
  const options = { ...common, ...languageOptions(language), outdir };
  await Promise.all([
    build({ ...options, entryPoints: ['src/extension.ts'], platform: 'node',
      target: 'node20', external: ['vscode'] }),
    build({ ...options, entryPoints: ['src/ui.ts', 'src/runner.ts'], platform: 'browser',
      target: 'chrome120', format: 'iife' }),
  ]);
}
