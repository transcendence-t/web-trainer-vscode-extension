import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const language = process.argv[2] ?? 'en';
if (!['en', 'zh-cn'].includes(language)) throw new Error('Unknown edition: ' + language);
const chinese = language === 'zh-cn';
const localized = (english, simplifiedChinese) => chinese ? simplifiedChinese : english;
const startCommand = localized('Start or Resume', '开始或继续学习');
const importCommand = localized('Import Course', '导入课程');
const exportCommand = localized('Export Course', '导出课程');
const activityLabel = localized(/Web Trainer/, /WEB闯关练习/);
const nickname = localized('Night heron', '夜鹭');
const windows = process.platform === 'win32';
const executable = process.env.WEB_TRAINER_VSCODE || (windows
  ? resolve(dirname(execFileSync('where.exe', ['code.cmd'], { encoding: 'utf8' }).trim().split(/\r?\n/)[0]), '..', 'Code.exe')
  : process.platform === 'darwin' ? '/Applications/Visual Studio Code.app/Contents/MacOS/Electron' : 'code');
const profile = await mkdtemp(join(tmpdir(), 'web-trainer-vscode-'));
const userData = join(profile, 'data');
const extensions = join(profile, 'extensions');
const release = JSON.parse(await readFile('package.json', 'utf8'));
const vsix = resolve(`web-trainer-${release.version}-${language}.vsix`);
const legacyVsix = resolve('web-trainer-1.0.0.vsix');
const builtIn = join('courses', localized('web-foundations', 'web-foundations-zh-cn'));
const manifest = JSON.parse(await readFile(join(builtIn, 'course.json'), 'utf8'));
const totalLevels = manifest.sections.reduce((total, section) => total + section.levels.length, 0);
const launchArgs = ['--user-data-dir', userData, '--extensions-dir', extensions];
const practice = join(userData, 'User', 'globalStorage', 'webclassroom.web-trainer', 'practice', manifest.id);
let child;
let browser;

function install(packageFile = vsix) {
  if (windows) {
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      '& $env:WEB_TRAINER_TEST_CLI --user-data-dir $env:WEB_TRAINER_TEST_DATA --extensions-dir $env:WEB_TRAINER_TEST_EXTENSIONS --install-extension $env:WEB_TRAINER_TEST_VSIX --force; exit $LASTEXITCODE'], {
      stdio: 'inherit', windowsHide: true, env: { ...process.env,
        WEB_TRAINER_TEST_CLI: join(dirname(executable), 'bin', 'code.cmd'), WEB_TRAINER_TEST_DATA: userData,
        WEB_TRAINER_TEST_EXTENSIONS: extensions, WEB_TRAINER_TEST_VSIX: packageFile,
      },
    });
  } else {
    const cli = process.platform === 'darwin' ? resolve(dirname(executable), '..', 'Resources', 'app', 'bin', 'code') : executable;
    execFileSync(cli, [...launchArgs, '--install-extension', packageFile, '--force'], { stdio: 'inherit' });
  }
}

async function until(probe, failure, timeout = 25_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const value = await probe();
    if (value) return value;
    await delay(150);
  }
  throw new Error(failure);
}

async function launch() {
  const port = await new Promise((done) => {
    const server = createServer().listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
  });
  const proxy = 'http://127.0.0.1:9';
  child = spawn(executable, [...launchArgs, `--remote-debugging-port=${port}`, '--disable-updates', '--skip-welcome',
    '--disable-background-networking', `--proxy-server=${proxy}`, '--proxy-bypass-list=<-loopback>'], {
    stdio: 'ignore', windowsHide: true, env: { ...process.env, HTTP_PROXY: proxy, HTTPS_PROXY: proxy },
  });
  const endpoint = `http://127.0.0.1:${port}`;
  await until(() => fetch(`${endpoint}/json/version`).then((response) => response.ok, () => false), 'VS Code 调试端口未就绪');
  browser = await chromium.connectOverCDP(endpoint, { timeout: 10_000 });
  const page = await until(() => browser.contexts()[0]?.pages().find((page) => page.url().includes('workbench')), '找不到 VS Code 工作台');
  await page.locator('.monaco-workbench').waitFor({ timeout: 15_000 });
  return page;
}

async function command(page, query) {
  await page.locator('.activitybar').getByLabel(/Web Trainer|网页闯关|WEB闯关练习/).first().waitFor({ timeout: 20_000 });
  await page.keyboard.press(windows || process.platform === 'linux' ? 'Control+Shift+p' : 'Meta+Shift+p');
  const input = page.locator('.quick-input-widget input:visible').first();
  await input.fill(`>${query}`);
  try {
    await page.locator('.quick-input-widget .monaco-list-row').filter({ hasText: query }).first().waitFor({ timeout: 10_000 });
  } catch (error) {
    console.error('命令面板内容：', (await page.locator('.quick-input-widget:visible').innerText().catch(() => '')).slice(0, 1400));
    console.error('命令面板输入：', await input.inputValue().catch(() => '不可用'));
    throw error;
  }
  await input.press('Enter');
}

async function lessonFrame(page) {
  return until(async () => {
    for (const frame of page.frames()) {
      if (await frame.locator('#lesson-title').isVisible().catch(() => false)) return frame;
    }
  }, '插件未在真实 VS Code 中显示题面').catch(async (error) => {
    console.error('工作台网页视图：', await Promise.all(page.frames().map(async (frame) => ({
      url: frame.url().split('?')[0],
      loading: await frame.locator('#loading').isVisible().catch(() => false),
    }))));
    throw error;
  });
}

async function edit(page, lesson, file, contents) {
  await lesson.getByRole('button', { name: file, exact: true }).click();
  const group = page.locator('.editor-group-container').filter({ has: page.locator(`.tab.active[aria-label*="${file}"]`) });
  await group.locator('.monaco-editor .view-lines:visible').first().click({ position: { x: 20, y: 9 }, timeout: 10_000 });
  const preview = lesson.locator('#preview-frame');
  const previous = await preview.getAttribute('srcdoc');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  await page.keyboard.insertText(contents);
  await until(async () => (await preview.getAttribute('srcdoc')) !== previous, `${file} 的编辑未更新预览`, 8000);
}

async function answer(id) {
  const directory = join(builtIn, 'levels', id, 'solution');
  const files = await readdir(directory);
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file, await readFile(join(directory, file), 'utf8')])));
}

async function checkAnswer(lesson, status) {
  const button = lesson.locator('#check');
  await button.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await button.click();
  const result = lesson.locator('#assessment:not([hidden])');
  await result.waitFor({ timeout: 20_000 });
  assert.equal(await result.getAttribute('data-status'), status, await result.innerText());
}

async function revealTreeRow(outline, row) {
  if (await row.isVisible()) return;
  await outline.press('Home');
  let lastViewport;
  for (;;) {
    if (await row.waitFor({ timeout: 220 }).then(() => true, () => false)) return;
    const viewport = await outline.evaluate((tree) => [
      tree.getAttribute('aria-activedescendant'),
      tree.querySelector('.monaco-list-row:last-child')?.getAttribute('data-index'),
    ].join('/'));
    if (viewport === lastViewport) break;
    lastViewport = viewport;
    await outline.press('PageDown');
  }
  throw new Error(`课程树中没有找到 ${row}`);
}

async function selectLevel(page, lesson, id) {
  const { title } = JSON.parse(await readFile(join(builtIn, 'levels', id, 'lesson.json'), 'utf8'));
  const section = manifest.sections.find((item) => item.levels.includes(id));
  const outline = page.locator('.part.sidebar .monaco-list[role="tree"]').first();
  if (!await outline.isVisible()) {
    await page.locator('.activitybar').getByLabel(/Web Trainer|网页闯关|WEB闯关练习/).first().click();
  }
  const tree = outline.locator('.monaco-list-row[role="treeitem"]');
  const sectionRow = tree.filter({ has: page.getByText(section.title, { exact: true }) }).first();
  await revealTreeRow(outline, sectionRow);
  if (await sectionRow.getAttribute('aria-expanded') !== 'true') await sectionRow.locator('.monaco-tl-twistie').click();
  const index = manifest.sections.flatMap((section) => section.levels).indexOf(id) + 1;
  const row = tree.filter({ has: page.getByText(`${index}. ${title}`, { exact: true }) });
  await revealTreeRow(outline, row);
  await row.click();
  await lesson.locator('#lesson-title').filter({ hasText: title }).waitFor({ timeout: 10_000 });
}

async function pickLocalPath(page, title, path) {
  const dialog = page.locator('.quick-input-widget:visible').filter({ hasText: title });
  const input = dialog.locator('input:visible').first();
  await input.fill(path, { timeout: 10_000 });
  await input.press('Enter');
}

async function exitVSCode() {
  if (!browser) return;
  const target = await browser.newBrowserCDPSession().catch(() => undefined);
  await target?.send('Browser.close').catch(() => {});
  if (child?.exitCode === null) {
    const exited = await until(() => child.exitCode !== null, 'VS Code 未退出', 5000).catch(() => false);
    if (!exited) child.kill();
  }
  await browser.close().catch(() => {});
  browser = undefined;
}

try {
  await mkdir(join(userData, 'User'), { recursive: true });
  await writeFile(join(userData, 'User', 'settings.json'), JSON.stringify({
    'workbench.startupEditor': 'none', 'window.restoreWindows': 'none', 'telemetry.telemetryLevel': 'off',
    'editor.formatOnSave': false, 'editor.autoIndent': 'none', 'editor.autoClosingBrackets': 'never',
    'editor.autoClosingQuotes': 'never', 'editor.autoSurround': 'never', 'html.autoClosingTags': false,
    'files.autoSave': 'off', 'files.simpleDialog.enable': true,
    'update.mode': 'none', 'extensions.autoUpdate': false,
  }));
  const oldAnswer = (await answer('html-heading'))['index.html'];
  const hasLegacy = chinese && await access(legacyVsix).then(() => true, () => false);
  if (hasLegacy) {
    install(legacyVsix);
    const oldPage = await launch();
    await command(oldPage, '开始或继续学习');
    const oldLesson = await lessonFrame(oldPage);
    assert.equal(await oldLesson.locator('#next').isVisible(), false);
    await edit(oldPage, oldLesson, 'index.html', oldAnswer);
    await checkAnswer(oldLesson, 'passed');
    await exitVSCode();
  }

  install();
  let page = await launch();
  page.on('console', (message) => {
    if (message.type() === 'error' && /webTrainer|runner\.js|ui\.js|content security policy/i.test(message.text())) {
      process.stderr.write(`${message.text()}\n`);
    }
  });

  await command(page, startCommand);
  let lesson = await lessonFrame(page);
  const preview = lesson.frameLocator('#preview-frame');
  assert.equal(await lesson.locator('html').getAttribute('lang'), localized('en', 'zh-CN'));
  assert.equal(await lesson.locator('#check').innerText(), localized('Check Answer', '检查答案'));
  assert.equal(await lesson.locator('#progress').evaluate((progress) => progress.max), totalLevels);
  if (hasLegacy) {
    assert.equal(await lesson.locator('#lesson-title').innerText(), '标题与段落');
    assert.equal(await lesson.locator('#progress').evaluate((progress) => progress.value), 1);
    assert.equal(await lesson.locator('#passed').isVisible(), true);
    assert.equal((await readFile(join(practice, 'html-heading', 'index.html'), 'utf8')).replace(/\r\n/g, '\n'), oldAnswer);
    console.log('从 1.0.0 升级后保留旧作答、进度和上次关卡。');
  }
  const initialExampleOpen = await lesson.locator('#example-code').isVisible();
  const [htmlSection, cssSection] = manifest.sections;
  await selectLevel(page, lesson, htmlSection.levels.at(-1));
  const nextId = cssSection.levels[0];
  const nextLesson = JSON.parse(await readFile(join(builtIn, 'levels', nextId, 'lesson.json'), 'utf8'));
  await lesson.locator('#next').click();
  await lesson.getByRole('heading', { name: nextLesson.title, exact: true }).waitFor({ timeout: 10_000 });
  const sidebar = page.locator('.part.sidebar .monaco-list[role="tree"]').first();
  const nextRow = sidebar.locator('[role="treeitem"][aria-selected="true"]').filter({
    has: page.getByText(`${htmlSection.levels.length + 1}. ${nextLesson.title}`, { exact: true }),
  });
  await nextRow.waitFor({ timeout: 10_000 });
  await page.locator('.activitybar').getByLabel(activityLabel).first().waitFor({ timeout: 10_000 });

  const groups = page.locator('.editor-group-container');
  const lessonGroup = groups.filter({ has: page.locator('.tab.active').filter({ hasText: nextLesson.title }) });
  const codeGroup = groups.filter({ has: page.locator(`.tab.active[aria-label*="${nextLesson.focus}"]`) });
  const [treeBox, lessonBox, codeBox] = await Promise.all([sidebar.boundingBox(), lessonGroup.boundingBox(), codeGroup.boundingBox()]);
  assert.ok(treeBox && lessonBox && codeBox && treeBox.x < lessonBox.x && lessonBox.x < codeBox.x,
    '课程树、题面和代码编辑器应从左到右排列');
  assert.equal(lessonBox.y, codeBox.y, '题面与编辑器应在同一行');

  assert.ok(initialExampleOpen, '打开关卡时默认展开代码示例');
  assert.ok(await lesson.locator('#example-code').isVisible());
  await lesson.locator('#example summary').click();
  assert.equal(await lesson.locator('#example-code').isVisible(), false);
  await lesson.locator('.lesson #solution summary').click();
  assert.ok(await lesson.locator('#solution-files pre').first().isVisible());
  console.log('跨章节下一关同步选中课程树，示例默认展开，题面和代码编辑器左右分栏。');

  const samples = [
    'project-calculator', 'html-document', 'html-responsive-picture',
    'css-selector', 'css-link-focus-visible', 'css-focus', 'css-grid-fluid', 'css-reduced-motion',
    'jsb-function', 'jsb-numeric-sort', 'js-text', 'js-fetch-json', 'js-modules', 'js-storage',
  ];
  for (const id of samples) {
    await selectLevel(page, lesson, id);
    assert.equal(await lesson.locator('#passed').isVisible(), false);
    if (id === samples[0]) {
      await checkAnswer(lesson, 'failed');
      assert.equal(await lesson.locator('#next').isVisible(), true);
      console.log('无需前置练习即可直接从课程树进入综合项目。');
    }
    if (id === 'js-text') {
      await edit(page, lesson, 'script.js', 'const broken = ;');
      await lesson.locator('#preview-error').filter({ hasText: localized(/script\.js, line 1, column /, /script\.js 第 1 行/) }).waitFor({ timeout: 10_000 });
    }
    const files = await answer(id);
    for (const [file, contents] of Object.entries(files)) {
      const saved = (await readFile(join(practice, id, file), 'utf8')).replace(/\r\n/g, '\n');
      if (saved !== contents) await edit(page, lesson, file, contents);
    }
    if (id === 'project-calculator') {
      assert.ok(Object.keys(files).length >= 2, '项目需要跨文件编辑');
      await preview.locator('#first-number').fill('8');
      await preview.locator('#second-number').fill('5');
      await preview.locator('#calc-add').click();
      await preview.locator('#calc-result').filter({ hasText: /^13$/ }).waitFor({ timeout: 10_000 });
    }
    if (id === 'css-selector') {
      await until(() => preview.locator('.card-title').evaluate((element) => getComputedStyle(element).color === 'rgb(18, 90, 70)'), '未保存的 CSS 未实时生效');
    }
    if (id === 'js-text') {
      await preview.getByText(localized('Ready', '准备就绪'), { exact: true }).waitFor({ timeout: 10_000 });
    }
    if (id === 'js-fetch-json') {
      await preview.locator('#load').click();
      await preview.getByText(localized('Open pottery studio', '陶艺开放'), { exact: true }).waitFor({ timeout: 10_000 });
    }
    if (id === 'js-modules') {
      await lesson.locator('#preview-frame').scrollIntoViewIfNeeded({ timeout: 10_000 });
      await preview.locator('#format').click({ timeout: 10_000 });
      await preview.getByText('LAB-003', { exact: true }).waitFor({ timeout: 10_000 });
    }
    await checkAnswer(lesson, 'passed');
    for (const [file, contents] of Object.entries(files)) {
      assert.equal((await readFile(join(practice, id, file), 'utf8')).replace(/\r\n/g, '\n'), contents, `${id} 未保存 ${file}`);
    }
    if (id === 'js-storage') {
      await preview.locator('#nickname').fill(nickname);
      await preview.locator('#save-name').click();
      await preview.locator('#saved-name').filter({ hasText: nickname }).waitFor({ timeout: 10_000 });
    }
    console.log(`${id} 桌面判题通过`);
  }

  const lastTitle = await lesson.locator('#lesson-title').innerText();
  await exitVSCode();
  page = await launch();
  await command(page, startCommand);
  lesson = await lessonFrame(page);
  await lesson.getByRole('heading', { name: lastTitle }).waitFor({ timeout: 10_000 });
  assert.equal(await lesson.locator('#progress').evaluate((progress) => progress.value), samples.length + Number(hasLegacy));
  assert.equal(await lesson.locator('#passed').isVisible(), true);
  await lesson.frameLocator('#preview-frame').locator('#saved-name').filter({ hasText: nickname }).waitFor({ timeout: 10_000 });
  console.log('重启后恢复自由学习进度、最近关卡及该关的本地存储。');

  const teacherDirectory = join(profile, 'teacher');
  await mkdir(teacherDirectory);
  await command(page, exportCommand);
  await pickLocalPath(page, localized('Choose where to export “' + manifest.title + '”', '选择「' + manifest.title + '」的导出位置'), teacherDirectory);
  const exported = join(teacherDirectory, manifest.id);
  const teacherManifest = join(exported, 'course.json');
  await until(() => readFile(teacherManifest, 'utf8').catch(() => false), '导出未生成 course.json');
  const teacherLesson = join(exported, 'levels', 'html-heading', 'lesson.json');
  const editedLesson = JSON.parse(await readFile(teacherLesson, 'utf8'));
  editedLesson.title = 'First classroom lesson';
  await writeFile(teacherLesson, JSON.stringify(editedLesson));
  await writeFile(teacherManifest, JSON.stringify({ ...manifest, id: 'class-demo', title: 'Classroom practice',
    sections: [{ id: 'html', title: 'HTML', levels: ['html-heading'] }],
  }));

  await command(page, importCommand);
  await pickLocalPath(page, localized('Select course.json from the course package', '选择课程包中的 course.json'), teacherManifest);
  await lesson.getByRole('heading', { name: 'First classroom lesson' }).waitFor({ timeout: 10_000 });
  assert.equal(await lesson.locator('#progress').evaluate((progress) => progress.value), 0);
  await edit(page, lesson, 'index.html', oldAnswer);
  await checkAnswer(lesson, 'passed');

  editedLesson.title = 'Updated classroom lesson';
  await writeFile(teacherLesson, JSON.stringify(editedLesson));
  await command(page, importCommand);
  await pickLocalPath(page, localized('Select course.json from the course package', '选择课程包中的 course.json'), teacherManifest);
  await lesson.getByRole('heading', { name: 'Updated classroom lesson' }).waitFor({ timeout: 10_000 });
  assert.equal(await lesson.locator('#progress').evaluate((progress) => progress.value), 1);
  await lesson.frameLocator('#preview-frame').getByRole('heading', { name: localized('My first webpage', '我的第一张网页') }).waitFor({ timeout: 10_000 });
  console.log('导出、导入和更新课程通过，教师课程拥有独立进度。');
} catch (error) {
  console.error(`临时测试配置：${profile}（${basename(executable)}）`);
  throw error;
} finally {
  await exitVSCode();
  if (!process.env.WEB_TRAINER_KEEP_TEST_PROFILE) {
    await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 300 });
  }
}
