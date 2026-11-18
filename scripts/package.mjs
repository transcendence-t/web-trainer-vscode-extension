import { execFileSync } from 'node:child_process';
import { copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { buildExtension, editions } from './build-extension.mjs';

const require = createRequire(import.meta.url);
const cli = require.resolve('@vscode/vsce/vsce');
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const englishReadmeUrl = manifest.repository.url.replace(/\.git$/, '') + '/blob/main/README.md';
const chineseLabels = {
  start: '开始或继续学习',
  check: '检查答案',
  importCourse: '导入课程',
  exportCourse: '导出课程',
  revealFiles: '查看当前练习文件夹',
};

await mkdir('.test-dist', { recursive: true });
for (const [language, courseDirectory] of Object.entries(editions)) {
  const stage = await mkdtemp(resolve('.test-dist', 'package-'));
  try {
    const { scripts, devDependencies, ...published } = structuredClone(manifest);
    const chinese = language === 'zh-cn';
    if (chinese) {
      published.displayName = '网页闯关';
      published.description = '在 VS Code 中离线学习 HTML、CSS 和 JavaScript。';
      published.contributes.viewsContainers.activitybar[0].title = 'WEB闯关练习';
      published.contributes.views.webTrainer[0].name = '课程关卡';
      for (const command of published.contributes.commands) {
        command.category = '网页闯关';
        command.title = chineseLabels[command.command.split('.').at(-1)];
      }
    }
    const readme = await readFile(chinese ? 'README.zh-CN.md' : 'README.md', 'utf8');
    const otherReadme = await readFile(chinese ? 'README.md' : 'README.zh-CN.md', 'utf8');
    await Promise.all([
      writeFile(join(stage, 'package.json'), JSON.stringify(published, null, 2) + '\n'),
      writeFile(join(stage, 'README.md'), chinese ? readme.replace('[English](README.md)', `[English](${englishReadmeUrl})`) : readme),
      writeFile(join(stage, chinese ? 'README.en.md' : 'README.zh-CN.md'), otherReadme),
      copyFile('LICENSE.txt', join(stage, 'LICENSE.txt')),
      copyFile('THIRD_PARTY_NOTICES.txt', join(stage, 'THIRD_PARTY_NOTICES.txt')),
      cp('media', join(stage, 'media'), { recursive: true }),
      cp(join('courses', courseDirectory), join(stage, 'courses', courseDirectory), { recursive: true }),
      buildExtension(language, join(stage, 'out')),
    ]);
    execFileSync(process.execPath, [cli, 'package', '--no-dependencies', '--githubBranch', 'main',
      '--out', resolve(`${manifest.name}-${manifest.version}-${language}.vsix`)], { cwd: stage, stdio: 'inherit' });
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
