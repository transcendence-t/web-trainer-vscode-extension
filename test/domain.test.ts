import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadCourse, writeCourse } from '../src/course';
import { firstUnfinished, isUnlocked } from '../src/progress';
import { compilePage } from '../src/preview';
import type { Course, Level } from '../src/model';

const level: Level = {
  id: 'first', title: '第一关', focus: 'index.html', summary: '打开编辑器。',
  tasks: ['添加标题。'], hint: '试试 h1。',
  starter: { 'index.html': '<main>练习</main>', 'style.css': '', 'script.js': '' },
  tests: [{ label: '存在标题', expect: { type: 'exists', selector: 'h1' } }],
};
const course: Course = {
  id: 'demo', title: '课堂练习', sections: [
    { id: 'html', title: 'HTML', levels: [level, { ...level, id: 'second' }] },
    { id: 'css', title: 'CSS', levels: [{ ...level, id: 'third', focus: 'style.css' }] },
  ],
};

test('教师导出后可以导入独立题面、起始代码和判题规则，且保留原目录', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'web-trainer-course-'));
  try {
    const manifest = await writeCourse(course, directory);
    assert.deepEqual(await loadCourse(manifest), course);
    assert.match(await readFile(join(directory, 'demo', 'levels', 'first', 'tests.json'), 'utf8'), /存在标题/);
    await assert.rejects(writeCourse(course, directory), /已存在/);
    assert.deepEqual(await loadCourse(manifest), course);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('错误的课程 ID 或判题规则被拒绝，并指明文件', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'web-trainer-invalid-'));
  try {
    const manifest = await writeCourse(course, directory);
    const tests = join(directory, 'demo', 'levels', 'first', 'tests.json');
    await writeFile(tests, JSON.stringify([{ label: '错误的检查', expect: { type: 'script', selector: 'h1' } }]));
    await assert.rejects(loadCourse(manifest), /first\/tests\.json.*不支持/u);
    await writeFile(tests, JSON.stringify([{ label: '错误的函数名', expect: { type: 'function', name: 'read();', args: [], value: null } }]));
    await assert.rejects(loadCourse(manifest), /first\/tests\.json.*JavaScript 标识符/u);
    const source = JSON.parse(await readFile(manifest, 'utf8'));
    source.sections[0].levels[0] = '../unrelated';
    await writeFile(manifest, JSON.stringify(source));
    await assert.rejects(loadCourse(manifest), /course\.json.*ID/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('课程跨章节顺序解锁，已通过的关卡可回看', () => {
  assert.equal(isUnlocked(course, [], 'first'), true);
  assert.equal(isUnlocked(course, [], 'second'), false);
  assert.equal(isUnlocked(course, ['first'], 'second'), true);
  assert.equal(isUnlocked(course, ['second'], 'third'), false);
  assert.equal(isUnlocked(course, ['first', 'second'], 'third'), true);
  assert.equal(isUnlocked(course, ['first', 'second'], 'first'), true);
  assert.equal(isUnlocked(course, ['first'], 'unknown'), false);
  assert.equal(firstUnfinished(course, ['first', 'second'])?.id, 'third');
});

test('自由课程可以直接打开综合练习，导出时保留教学示例和参考答案', async () => {
  const free = structuredClone(course);
  Object.assign(free, { navigation: 'free' });
  Object.assign(free.sections[0].levels[0], {
    goal: '能写出一个一级标题。',
    example: { language: 'html', code: '<h1>器材清单</h1>', note: '观察成对标签。' },
    solution: { 'index.html': '<h1>练习</h1>' },
  });
  free.sections[0].levels[0].tests.push(
    { label: '伪元素标记', expect: { type: 'style', selector: 'h1', pseudo: '::before', property: 'content', value: '"导览"' } },
    { label: '打印时隐藏导航', expect: { type: 'style', selector: 'nav', property: 'display', value: 'none', media: { query: 'print', matches: true } } },
    { label: '选中了同意框', expect: { type: 'property', selector: '#agree', name: 'checked', value: true } },
  );
  assert.equal(isUnlocked(free, [], 'third'), true);
  assert.equal(isUnlocked(free, [], 'unknown'), false);
  const directory = await mkdtemp(join(tmpdir(), 'web-trainer-free-'));
  try {
    assert.deepEqual(await loadCourse(await writeCourse(free, directory)), free);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('半写完的 JavaScript 报文件行号，HTML 仍可生成预览', () => {
  const page = compilePage({ ...level.starter, 'script.js': '// 练习\nconst value = ;' }, 'sample-nonce', '');
  assert.match(page.html, /<main>练习<\/main>/u);
  assert.match(page.issues[0], /^script\.js 第 2 行/u);
});
