import { randomUUID } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { parse } from 'acorn';
import { layoutRelations, lessonFiles, storageFits, type Action, type Check, type Course, type Expectation, type Json, type LayoutRelation, type LessonExample, type LessonFile, type Level, type MediaCondition, type PracticeCode, type StorageEntries } from './model';

function invalid(message: string): never {
  throw new Error(message);
}

function object(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    invalid(`${name} 应为对象`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, name: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
    invalid(`${name} 应为${allowEmpty ? '' : '非空'}字符串`);
  }
  return value;
}

function list(value: unknown, name: string, allowEmpty = false): unknown[] {
  if (!Array.isArray(value) || (!allowEmpty && !value.length)) {
    invalid(`${name} 应为${allowEmpty ? '' : '非空'}数组`);
  }
  return value;
}

function id(value: unknown): string {
  const name = string(value, 'ID');
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(name) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(name)) {
    invalid(`无效的 ID「${name}」，请使用小写字母开头的字母、数字、下划线或连字符`);
  }
  return name;
}

function unique(ids: string[]) {
  if (new Set(ids).size !== ids.length) invalid('ID 重复');
}

async function json<T>(directory: string, path: string, read: (value: unknown) => T): Promise<T> {
  try {
    const source = await readFile(join(directory, path), 'utf8');
    return read(JSON.parse(source.replace(/^\uFEFF/, '')));
  } catch (error) {
    const failure = error as NodeJS.ErrnoException;
    throw new Error(`${path}：${failure.code === 'ENOENT' ? '找不到文件' : failure.message}`);
  }
}

function readManifest(value: unknown): Pick<Course, 'id' | 'title' | 'navigation'> & { sections: { id: string; title: string; levels: string[] }[] } {
  const course = object(value, '课程');
  if (course.version !== 1) invalid('version 应为 1');
  const navigation = course.navigation;
  if (navigation !== undefined && navigation !== 'free' && navigation !== 'sequential') invalid('navigation 应为 free 或 sequential');
  const sections = list(course.sections, 'sections').map((entry) => {
    const section = object(entry, '章节');
    return {
      id: id(section.id), title: string(section.title, '章节标题'),
      levels: list(section.levels, 'levels').map(id),
    };
  });
  unique(sections.map((section) => section.id));
  unique(sections.flatMap((section) => section.levels));
  return { id: id(course.id), title: string(course.title, '课程标题'), sections, ...(navigation === undefined ? {} : { navigation }) };
}

function readExample(value: unknown): LessonExample {
  const example = object(value, 'example');
  const language = example.language;
  if (language !== 'html' && language !== 'css' && language !== 'javascript') invalid('示例 language 应为 html、css 或 javascript');
  return { language, code: string(example.code, 'example.code'), note: string(example.note, 'example.note') };
}

function readLesson(value: unknown) {
  const lesson = object(value, '关卡');
  const focus = lesson.focus as LessonFile;
  if (!lessonFiles.includes(focus)) invalid(`focus 应选 ${lessonFiles.join('、')} 之一`);
  return {
    title: string(lesson.title, '关卡标题'), focus,
    summary: string(lesson.summary, 'summary'),
    tasks: list(lesson.tasks, 'tasks').map((task) => string(task, '任务')),
    ...(lesson.goal === undefined ? {} : { goal: string(lesson.goal, 'goal') }),
    ...(lesson.example === undefined ? {} : { example: readExample(lesson.example) }),
    ...(lesson.hint === undefined ? {} : { hint: string(lesson.hint, 'hint') }),
  };
}

function integer(value: unknown, minimum: number, maximum: number, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    invalid(`${name} 应为 ${minimum} 到 ${maximum} 之间的整数`);
  }
  return value;
}

function readAction(value: unknown): Action {
  const action = object(value, '操作');
  if (action.type === 'wait') return { type: 'wait', ms: integer(action.ms, 0, 1500, 'wait.ms') };
  const selector = string(action.selector, 'selector');
  switch (action.type) {
    case 'click': return { type: 'click', selector };
    case 'input': return { type: 'input', selector, value: string(action.value, 'value', true) };
    case 'focus': return { type: 'focus', selector };
    case 'key': return { type: 'key', selector, key: string(action.key, 'key') };
    case 'finish-motion': return { type: 'finish-motion', selector };
    default: return invalid('不支持的操作类型');
  }
}

function readFunctionName(value: unknown): string {
  const name = string(value, '函数名');
  if (!/^[a-z_$][a-z0-9_$]*$/i.test(name)) invalid('函数名应为有效的 JavaScript 标识符');
  try {
    parse(`function ${name}() {}`, { ecmaVersion: 'latest' });
  } catch {
    invalid(`函数名「${name}」无效`);
  }
  return name;
}

function readMediaCondition(value: unknown): MediaCondition {
  const media = object(value, 'media');
  if (typeof media.matches !== 'boolean') invalid('media.matches 应为布尔值');
  return { query: string(media.query, 'media.query'), matches: media.matches };
}

function readExpectation(value: unknown): Expectation {
  const expected = object(value, 'expect');
  if (expected.type === 'function') {
    if (!Object.hasOwn(expected, 'value')) invalid('函数测试缺少预期返回值 value');
    return { type: 'function', name: readFunctionName(expected.name), args: list(expected.args, 'args', true) as Json[], value: expected.value as Json };
  }
  if (expected.type === 'storage') return { type: 'storage', key: string(expected.key, 'key', true), value: expected.value === null ? null : string(expected.value, 'value', true) };
  if (!['exists', 'count', 'text', 'attribute', 'property', 'style', 'layout'].includes(String(expected.type))) invalid('不支持的检查类型');
  const selector = string(expected.selector, 'selector');
  switch (expected.type) {
    case 'exists': return { type: 'exists', selector };
    case 'count': {
      const count = expected.value;
      if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) {
        invalid('count 的 value 应为非负整数');
      }
      return { type: 'count', selector, value: count };
    }
    case 'text': return { type: 'text', selector, value: string(expected.value, 'value', true) };
    case 'attribute': return { type: 'attribute', selector, name: string(expected.name, 'name'), value: string(expected.value, 'value', true) };
    case 'property': {
      if (!Object.hasOwn(expected, 'value')) invalid('DOM 属性检查缺少预期值 value');
      return { type: 'property', selector, name: string(expected.name, 'name'), value: expected.value as Json };
    }
    case 'style': return { type: 'style', selector, property: string(expected.property, 'property'), value: string(expected.value, 'value'),
      ...(expected.pseudo === undefined ? {} : { pseudo: string(expected.pseudo, 'pseudo') }),
      ...(expected.media === undefined ? {} : { media: readMediaCondition(expected.media) }),
    };
    case 'layout': {
      const relation = expected.relation as LayoutRelation;
      if (!layoutRelations.includes(relation)) invalid('不支持的布局关系');
      return { type: 'layout', selector, relativeTo: string(expected.relativeTo, 'relativeTo'), relation };
    }
    default: return invalid('不支持的检查类型');
  }
}

function readStorage(value: unknown): Record<string, string> {
  const entries: StorageEntries = Object.entries(object(value, 'storage')).map(([key, item]) => [key, string(item, '存储值', true)]);
  if (!storageFits(entries)) invalid('storage 超过课程存储上限');
  return Object.fromEntries(entries);
}

function readTests(value: unknown): Check[] {
  return list(value, '测试列表').map((entry) => {
    const rule = object(entry, '测试');
    return {
      label: string(rule.label, 'label'),
      expect: readExpectation(rule.expect),
      ...(rule.hint === undefined ? {} : { hint: string(rule.hint, 'hint') }),
      ...(rule.actions === undefined ? {} : { actions: list(rule.actions, 'actions', true).map(readAction) }),
      ...(rule.viewport === undefined ? {} : { viewport: integer(rule.viewport, 240, 1600, 'viewport') }),
      ...(rule.storage === undefined ? {} : { storage: readStorage(rule.storage) }),
    };
  });
}

async function readSolution(directory: string): Promise<Partial<PracticeCode> | undefined> {
  const entries = await Promise.all(lessonFiles.map(async (file) => {
    try {
      return [file, await readFile(join(directory, 'solution', file), 'utf8')] as const;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }));
  const solution = Object.fromEntries(entries.filter((entry) => entry !== undefined));
  return Object.keys(solution).length ? solution : undefined;
}

async function loadLevel(directory: string, levelId: string): Promise<Level> {
  const path = `levels/${levelId}`;
  const [lesson, tests, solution, [index, css, js]] = await Promise.all([
    json(directory, `${path}/lesson.json`, readLesson),
    json(directory, `${path}/tests.json`, readTests),
    readSolution(join(directory, path)),
    Promise.all(lessonFiles.map(async (file) => {
      const filePath = `${path}/starter/${file}`;
      try {
        return await readFile(join(directory, filePath), 'utf8');
      } catch {
        throw new Error(`${filePath}：无法读取起始文件`);
      }
    })),
  ]);
  return { id: levelId, ...lesson, tests, ...(solution ? { solution } : {}), starter: { 'index.html': index, 'style.css': css, 'script.js': js } };
}

export async function loadCourse(manifestPath: string): Promise<Course> {
  if (basename(manifestPath) !== 'course.json') invalid('请选择课程包中的 course.json 文件');
  const directory = dirname(manifestPath);
  const manifest = await json(directory, 'course.json', readManifest);
  const sections = await Promise.all(manifest.sections.map(async (section) => ({
    ...section,
    levels: await Promise.all(section.levels.map((levelId) => loadLevel(directory, levelId))),
  })));
  return { ...manifest, sections };
}

function encode(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function writeCourse(course: Course, parent: string): Promise<string> {
  const target = join(parent, course.id);
  const exists = await lstat(target).then(() => true, (error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return false;
    throw error;
  });
  if (exists) throw new Error(`目录「${course.id}」已存在，请选择其他位置`);

  const staging = await mkdtemp(join(parent, '.web-trainer-'));
  try {
    const sections = course.sections.map((section) => ({
      id: section.id, title: section.title, levels: section.levels.map((level) => level.id),
    }));
    await writeFile(join(staging, 'course.json'), encode({ version: 1, id: course.id, title: course.title, navigation: course.navigation, sections }));
    for (const { id, starter, tests, solution, ...lesson } of course.sections.flatMap((section) => section.levels)) {
      const directory = join(staging, 'levels', id);
      await mkdir(join(directory, 'starter'), { recursive: true });
      await writeFile(join(directory, 'lesson.json'), encode(lesson));
      await writeFile(join(directory, 'tests.json'), encode(tests));
      for (const file of lessonFiles) await writeFile(join(directory, 'starter', file), starter[file]);
      if (solution) {
        await mkdir(join(directory, 'solution'), { recursive: true });
        for (const file of lessonFiles) {
          if (solution[file] !== undefined) await writeFile(join(directory, 'solution', file), solution[file]);
        }
      }
    }
    await rename(staging, target);
    return join(target, 'course.json');
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

export async function loadImportedCourses(directory: string): Promise<Course[]> {
  const files = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return Promise.all(files.filter((file) => file.isFile() && file.name.endsWith('.json')).map((file) =>
    json(directory, file.name, (value) => value as Course)));
}

export async function storeImportedCourse(directory: string, course: Course): Promise<void> {
  await mkdir(directory, { recursive: true });
  const temporary = join(directory, `${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, encode(course), { flag: 'wx' });
    await rename(temporary, join(directory, `${course.id}.json`));
  } finally {
    await rm(temporary, { force: true });
  }
}
