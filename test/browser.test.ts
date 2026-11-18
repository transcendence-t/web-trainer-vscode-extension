import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { chromium, type Browser, type Page } from 'playwright-core';
import { compilePage } from '../src/preview';
import { loadCourse } from '../src/course';
import { checkTimeout, sandboxPermissions, type Check, type CheckResult, type PracticeCode } from '../src/model';

const nonce = 'test-web-trainer-nonce';
let browser: Browser;
let page: Page;
let runner: string;

before(async () => {
  const locations = [process.env.WEB_TRAINER_CHROME, ...[
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]].filter((location): location is string => Boolean(location));
  let executablePath: string | undefined;
  for (const location of locations) {
    if (await access(location).then(() => true, () => false)) {
      executablePath = location;
      break;
    }
  }
  browser = await chromium.launch({ executablePath, headless: true, args: ['--force-device-scale-factor=1.25'] });
  const context = await browser.newContext();
  page = await context.newPage();
  runner = await readFile(join('out', 'runner.js'), 'utf8');
  await page.route('https://web-trainer.test/', (route) => route.fulfill({ body:
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src 'self' about:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' data:; img-src data:; media-src data:; connect-src data:">`,
    contentType: 'text/html',
  }));
  await page.goto('https://web-trainer.test/');
  await context.setOffline(true);
});
after(async () => { await browser?.close(); });

async function check(code: PracticeCode, rule: Check, initialWidth?: number): Promise<CheckResult> {
  const compiled = compilePage(code, nonce, runner, {
    functions: rule.expect.type === 'function' ? [rule.expect.name] : [], storage: Object.entries(rule.storage ?? {}),
  });
  assert.deepEqual(compiled.issues, []);
  return page.evaluate(({ html, ruleJson, permissions, timeout, initialWidth }) => new Promise<CheckResult>((resolve, reject) => {
    const rule = JSON.parse(ruleJson) as Check;
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', permissions);
    frame.style.cssText = `position: fixed; top: 0; left: -10000px; width: ${initialWidth ?? rule.viewport ?? 480}px; height: 360px; border: 0`;
    const channel = new MessageChannel();
    const timer = setTimeout(() => finish(() => reject(new Error('判题沙箱超时'))), timeout);
    function finish(done: () => void) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      channel.port1.close();
      frame.remove();
      done();
    }
    function onMessage(event: MessageEvent) {
      if (event.source === frame.contentWindow && event.data?.type === 'ready') {
        frame.contentWindow!.postMessage({ type: 'check', rule }, '*', [channel.port2]);
        if (initialWidth !== undefined) setTimeout(() => { frame.style.width = `${rule.viewport}px`; }, 70);
      }
    }
    window.addEventListener('message', onMessage);
    channel.port1.onmessage = (event) => finish(() => resolve(event.data));
    document.body.append(frame);
    frame.getBoundingClientRect();
    frame.srcdoc = html;
  }), { html: compiled.html, ruleJson: JSON.stringify(rule), permissions: sandboxPermissions, timeout: checkTimeout(rule), initialWidth });
}

const code: PracticeCode = {
  'index.html': '<!doctype html><html lang="zh-CN"><head><link rel="stylesheet" href="./style.css"><script defer src="script.js"></script></head><body><h1>网页</h1><button id="add">加一</button><output id="count">0</output></body></html>',
  'style.css': 'h1 { color: #125a46; }',
  'script.js': `let total = 0;
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelector('#add').addEventListener('click', () => {
        document.querySelector('#count').textContent = ++total;
      });
    });`,
};

test('断网的真实浏览器检查 HTML 文字和 CSS 计算值', async () => {
  assert.equal((await check(code, { label: '标题', expect: { type: 'text', selector: 'h1', value: '网页' } })).passed, true);
  assert.equal((await check(code, { label: '颜色', expect: { type: 'style', selector: 'h1', property: 'color', value: 'rgb(18, 90, 70)' } })).passed, true);
  assert.match((await check(code, { label: '文字', expect: { type: 'text', selector: 'h1', value: '欢迎' } })).detail!, /网页/u);
});

test('伪元素样式按伪元素自身的计算值判题', async () => {
  const rule: Check = { label: '名称前的标识', expect: { type: 'style', selector: 'h1', pseudo: '::before', property: 'content', value: '"通知"' } };
  const labelCode = { ...code, 'style.css': 'h1::before { content: "通知"; }' };
  assert.equal((await check(labelCode, rule)).passed, true);
  assert.equal((await check({ ...labelCode, 'style.css': '' }, rule)).passed, false);
});

test('可独立检查媒体条件启用和停用的样式', async () => {
  const query = '(prefers-reduced-motion: reduce)';
  const motion = { ...code, 'style.css': `h1 { animation-name: pulse; }
    @media ${query} { h1 { animation-name: none; } }` };
  for (const [matches, value] of [[true, 'none'], [false, 'pulse']] as const) {
    const rule: Check = { label: '减少动效', expect: {
      type: 'style', selector: 'h1', property: 'animation-name', value, media: { query, matches },
    } };
    const result = await check(motion, rule);
    assert.equal(result.passed, true, result.detail);
    assert.equal((await check({ ...motion, 'style.css': `h1 { animation-name: ${value}; }` }, rule)).passed, false);
  }
});

test('DOM 属性检查读取点击后的值和类型', async () => {
  const checkbox = { ...code, 'index.html': '<input type="checkbox" id="confirm">', 'script.js': '' };
  const rule: Check = { label: '确认框已选择', expect: { type: 'property', selector: '#confirm', name: 'checked', value: true } };
  assert.equal((await check(checkbox, rule)).passed, false);
  assert.equal((await check(checkbox, { ...rule, actions: [{ type: 'click', selector: '#confirm' }] })).passed, true);
});

test('断网时仍能 Fetch Data URL，远程 Fetch 被 CSP 拦截', async () => {
  const fetchCode = { ...code, 'script.js': `
    async function readFixture() {
      const request = await fetch('data:application/json,%7B%22room%22%3A%22B305%22%7D');
      const data = await request.json();
      const violation = new Promise((resolve) => window.addEventListener('securitypolicyviolation',
        (event) => resolve(event.effectiveDirective), { once: true }));
      await fetch('https://web-trainer.test/remote.json').catch(() => {});
      return [request.ok, data.room, await violation];
    }
  ` };
  const result = await check(fetchCode, { label: '读取离线数据', expect: {
    type: 'function', name: 'readFixture', args: [], value: [true, 'B305', 'connect-src'],
  } });
  assert.equal(result.passed, true, result.detail);
});

test('离线模块可从 script.js 导入，直接加载和导入共享同一模块', async () => {
  const modulesCode = { ...code, 'index.html': `
    <script type="module" src="./script.js"></script>
    <output>待计算</output>
    <script type="module">
      import { seats } from './script.js';
      document.querySelector('output').textContent = seats(6) + '/' + window.moduleRuns;
    </script>
  `, 'script.js': 'window.moduleRuns = (window.moduleRuns ?? 0) + 1; export const seats = (rows) => rows * 3;' };
  const result = await check(modulesCode, { label: '模块只执行一次', expect: { type: 'text', selector: 'output', value: '18/1' } });
  assert.equal(result.passed, true, result.detail);
});

test('函数规则支持箭头函数和结构化结果，数组顺序与值类型仍需正确', async () => {
  const js = { ...code, 'script.js': `const name = (items) => ({ count: items.length, items: items.slice().reverse() });` };
  const rule: Check = { label: '返回对象', expect: { type: 'function', name: 'name', args: [['甲', '乙']], value: { items: ['乙', '甲'], count: 2 } } };
  assert.equal((await check(js, rule)).passed, true);
  const wrong = { ...js, 'script.js': `function name(items) { return { items, count: '2' }; }` };
  assert.equal((await check(wrong, rule)).passed, false);
});

test('实际布局检查可使用不同视口触发媒体查询', async () => {
  const rows = { ...code, 'index.html': '<main><div id="first">A</div><div id="second">B</div></main>', 'script.js': '',
    'style.css': '@media(min-width: 600px) { main { display: flex; } }' };
  assert.equal((await check(rows, { label: '窄屏分行', viewport: 350,
    expect: { type: 'layout', selector: '#second', relativeTo: '#first', relation: 'below' } } as Check)).passed, true);
  assert.equal((await check(rows, { label: '宽屏并排', viewport: 760,
    expect: { type: 'layout', selector: '#second', relativeTo: '#first', relation: 'right-of' } } as Check)).passed, true);
});

test('收到判题请求后等待视口匹配，避开嵌套窗口的初始宽度', async () => {
  const rows = { ...code, 'index.html': '<main><div id="first">A</div><div id="second">B</div></main>', 'script.js': '',
    'style.css': '@media(min-width: 600px) { main { display: flex; } }' };
  const result = await check(rows, { label: '窄屏分行', viewport: 350,
    expect: { type: 'layout', selector: '#second', relativeTo: '#first', relation: 'below' } }, 760);
  assert.equal(result.passed, true, result.detail);
});

test('离屏判题可直接采样动效终态', async () => {
  const transition = { ...code, 'index.html': '<div id="lamp">灯</div>', 'script.js': '',
    'style.css': '#lamp { animation: brighten 20s both paused; } @keyframes brighten { from { opacity: .25; } to { opacity: 1; } }' };
  const result = await check(transition, { label: '终态', actions: [
    { type: 'finish-motion', selector: '#lamp' },
  ], expect: { type: 'style', selector: '#lamp', property: 'opacity', value: '1' } });
  assert.equal(result.passed, true, result.detail);
});

test('沙箱存储可用，写入与带种子载入互相隔离', async () => {
  const storageCode = { ...code, 'index.html': '<output></output><button id="save">保存</button>',
    'script.js': `document.querySelector('output').textContent = localStorage.getItem('topic') ?? '空';
       document.querySelector('#save').addEventListener('click', () => localStorage.setItem('topic', '排版'));` };
  const saved = { label: '保存键值', actions: [{ type: 'click', selector: '#save' }],
    expect: { type: 'storage', key: 'topic', value: '排版' } } as Check;
  assert.equal((await check(storageCode, saved)).passed, true);
  const initial: Check = { label: '空页面', expect: { type: 'text', selector: 'output', value: '空' } };
  assert.equal((await check(storageCode, initial)).passed, true);
  const existing = { label: '读入历史值', storage: { topic: '布局' }, expect: { type: 'text', selector: 'output', value: '布局' } } as Check;
  assert.equal((await check(storageCode, existing)).passed, true);
});

test('125% 显示缩放下的正确边框可以通过，错误宽度仍会失败', async () => {
  const expect: Check['expect'] = { type: 'style', selector: 'h1', property: 'border', value: '2px solid rgb(59, 125, 104)' };
  const correct = await check({ ...code, 'style.css': 'h1 { border: 2px solid #3b7d68; }' }, { label: '边框', expect });
  assert.equal(correct.passed, true, correct.detail);
  const wrong = await check({ ...code, 'style.css': 'h1 { border: 1px solid #3b7d68; }' }, { label: '边框', expect });
  assert.equal(wrong.passed, false);
});

test('判题在全新页面按顺序点击并执行带 defer 的 JavaScript', async () => {
  for (const total of [2, 1]) {
    const result = await check(code, { label: '计数', actions: Array.from({ length: total }, () => ({ type: 'click', selector: '#add' })),
      expect: { type: 'text', selector: '#count', value: String(total) } });
    assert.deepEqual(result, { passed: true });
  }
});

test('预览中的 nonce 无法授权网络脚本', async () => {
  const result = await check({ ...code, 'index.html': '<output>未阻止</output>', 'script.js': `
    const external = document.createElement('script');
    external.src = 'https://web-trainer.test/payload.js';
    external.nonce = document.currentScript.nonce;
    document.addEventListener('securitypolicyviolation', (event) => {
      if (event.blockedURI.startsWith('https:')) document.querySelector('output').textContent = '已阻止';
    });
    document.body.append(external);
  ` }, { label: '阻止远程脚本', expect: { type: 'text', selector: 'output', value: '已阻止' } });
  assert.equal(result.passed, true, result.detail);
});

test('语法正确但运行失败或循环无终点时，给出可继续编辑的反馈', async () => {
  const rule: Check = { label: '存在标题', expect: { type: 'exists', selector: 'h1' } };
  for (const [script, message] of [
    ['document.querySelector("#missing").textContent = "x";', /script\.js.*null/u],
    ['while (true) { /* 忘了写退出条件 */ }', /循环.*结束条件/u],
  ] as const) {
    const result = await check({ ...code, 'script.js': script }, rule);
    assert.equal(result.passed, false);
    assert.match(result.detail!, message);
  }
});

test('点击页内锚点会定位到当前预览中的目标', async () => {
  const links = { ...code, 'script.js': '', 'index.html': '<nav><a href="#lab">导览</a></nav><h2 id="lab">实训室</h2>' };
  const result = await check(links, { label: '目标定位', actions: [{ type: 'click', selector: 'a' }],
    expect: { type: 'exists', selector: '#lab:target' } });
  assert.equal(result.passed, true, result.detail);
});

test('表单可执行浏览器的 required 校验与提交事件', async () => {
  const form = { ...code,
    'index.html': '<form><input id="name" required><button type="submit">提交</button></form><output></output>',
    'script.js': `const output = document.querySelector('output');
      document.querySelector('input').addEventListener('invalid', () => output.textContent = '姓名必填');
      document.querySelector('form').addEventListener('submit', () => output.textContent = '本地已收到');`,
  };
  const click = { type: 'click', selector: 'button' } as const;
  for (const [actions, text] of [[ [click], '姓名必填'], [ [{ type: 'input', selector: 'input', value: '小周' }, click], '本地已收到']] as [Check['actions'], string][]) {
    const result = await check(form, { label: '表单反馈', actions, expect: { type: 'text', selector: 'output', value: text } });
    assert.equal(result.passed, true, result.detail);
  }
});

const coursePath = join('courses', 'web-foundations', 'course.json');
const modules = [
  ['html', 'HTML 基础'], ['css', 'CSS 基础'], ['css-advanced', 'CSS 进阶'],
  ['js-basics', 'JavaScript 基础'], ['javascript', 'JavaScript 网页交互'], ['projects', '综合项目'],
] as const;

async function fixtures<T>(kind: string): Promise<Record<string, T>> {
  const directory = join('test', kind);
  const paths = (await readdir(directory)).filter((name) => name.endsWith('.json'));
  const entries = await Promise.all(paths.map(async (file) => JSON.parse(await readFile(join(directory, file), 'utf8'))));
  return Object.assign({}, ...entries);
}

test('内置课程的六模块顺序和自由学习模式正确，关卡均已收录', async () => {
  const course = await loadCourse(coursePath);
  assert.equal(course.id, 'web-foundations');
  assert.equal(course.navigation, 'free');
  assert.deepEqual(course.sections.map(({ id, title }) => [id, title]), modules);
  const onDisk = await readdir(join('courses', 'web-foundations', 'levels'), { withFileTypes: true });
  assert.deepEqual(course.sections.flatMap(({ levels }) => levels.map(({ id }) => id)).sort(),
    onDisk.filter((entry) => entry.isDirectory()).map(({ name }) => name).sort());
});

for (const [id, title] of modules) {
  test(`课程 ${title}`, async (t) => {
    const course = await loadCourse(coursePath);
    const section = course.sections.find((entry) => entry.id === id);
    assert.ok(section);
    const mistakes = await fixtures<{ name: string; files: Partial<PracticeCode> }>('mistakes');
    const alternatives = await fixtures<Partial<PracticeCode>>('alternatives');
    for (const level of section.levels) {
      await t.test(`${level.id} ${level.title}`, async () => {
        assert.ok(level.goal && level.example?.code && level.example.note && level.hint, '题面缺少目标、示例或错误提示');
        assert.ok(level.solution && Object.keys(level.solution).length, '缺少参考答案');
        assert.ok(level.tests.length >= 2, '应从不同角度检查任务');
        const mistake = mistakes[level.id];
        assert.ok(mistake?.name && Object.keys(mistake.files).length, '缺少典型错例');
        const run = async (files: PracticeCode) => {
          if (!level.tests.some((rule) => rule.actions?.some((action) => action.type === 'focus'))) {
            return Promise.all(level.tests.map((rule) => check(files, rule)));
          }
          // A browser tab has one focus owner. These scenarios run serially, as in the extension.
          const results = [];
          for (const rule of level.tests) results.push(await check(files, rule));
          return results;
        };
        const answer = { ...level.starter, ...level.solution };
        const results = await run(answer);
        assert.ok(results.every((result) => result.passed), results.map((result, i) => result.passed ? '' : `${level.tests[i].label} ${result.detail}`).filter(Boolean).join('\n'));
        const starting = await run(level.starter);
        assert.ok(starting.some((result) => !result.passed), '起始代码已通过');
        const wrong = await run({ ...answer, ...mistake.files });
        assert.ok(wrong.some((result) => !result.passed), `未拦截典型错误「${mistake.name}」`);
        const alternate = alternatives[level.id];
        if (alternate) assert.ok((await run({ ...answer, ...alternate })).every((result) => result.passed), '合理的其他写法被误判');
      });
    }
    assert.ok(section.levels.some((level) => alternatives[level.id]), '模块未验证其他正确写法');
  });
}
