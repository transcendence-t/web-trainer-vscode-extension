import { checkTimeout, lessonFiles, sandboxPermissions, type Check, type CheckResult, type HostMessage, type LessonView, type PanelMessage } from './model';

declare function acquireVsCodeApi(): { postMessage(message: PanelMessage): void };
const host = acquireVsCodeApi();

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const activity = byId('activity');
const checkButton = byId<HTMLButtonElement>('check');
const nextButton = byId<HTMLButtonElement>('next');
const assessment = byId('assessment');
const previewError = byId('preview-error');
let frame = byId<HTMLIFrameElement>('preview-frame');
let activeKey: string | undefined;
let previewKey: string | undefined;
let revision = -1;
let previewIssues: string[] = [];
let checking: AbortController | undefined;

function updateLesson(lesson: LessonView) {
  const changed = lesson.key !== activeKey;
  if (changed) {
    activeKey = lesson.key;
    byId<HTMLDetailsElement>('example').open = Boolean(lesson.example);
    for (const id of ['hint', 'solution']) byId<HTMLDetailsElement>(id).open = false;
    clearCheck();
  }
  activity.hidden = false;
  byId('loading').hidden = true;
  byId('course-title').textContent = `${lesson.courseTitle} / ${lesson.sectionTitle}`;
  byId('position').textContent = `第 ${lesson.position} / ${lesson.total} 关`;
  const progress = byId<HTMLProgressElement>('progress');
  progress.max = lesson.total;
  progress.value = lesson.completed;
  progress.setAttribute('aria-valuetext', `已通过 ${lesson.completed} / ${lesson.total} 关`);
  byId('lesson-title').textContent = lesson.title;
  byId('goal').hidden = !lesson.goal;
  byId('goal').textContent = lesson.goal ? `学习目标 · ${lesson.goal}` : '';
  byId('summary').textContent = lesson.summary;
  byId('example').hidden = !lesson.example;
  byId('example-note').textContent = lesson.example?.note ?? '';
  const exampleCode = byId('example-code');
  exampleCode.textContent = lesson.example?.code ?? '';
  exampleCode.setAttribute('aria-label', lesson.example ? `${lesson.example.language} 示例代码` : '示例代码');
  byId('tasks').replaceChildren(...lesson.tasks.map((task) => {
    const item = document.createElement('li');
    item.textContent = task;
    return item;
  }));
  byId('hint').hidden = !lesson.hint;
  byId('hint-text').textContent = lesson.hint ?? '';
  const solutions = lessonFiles.flatMap((file) => {
    if (lesson.solution?.[file] === undefined) return [];
    const title = document.createElement('h3');
    title.textContent = file;
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = lesson.solution[file];
    pre.append(code);
    return [title, pre];
  });
  byId('solution').hidden = !solutions.length;
  byId('solution-files').replaceChildren(...solutions);
  byId('files').replaceChildren(...lessonFiles.map((file) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = file;
    button.title = `在编辑器中打开 ${file}`;
    button.className = file === lesson.focus ? 'file focus-file' : 'file';
    button.addEventListener('click', () => host.postMessage({ type: 'edit', file }));
    return button;
  }));
  nextButton.hidden = !lesson.hasNext;
  byId('passed').hidden = !lesson.passed;
  if (changed) window.scrollTo(0, 0);
}

function clearCheck() {
  checking?.abort();
  checking = undefined;
  checkButton.disabled = false;
  checkButton.textContent = '检查答案';
  assessment.hidden = true;
}

function reportPreview(runtimeIssue?: string) {
  const issues = runtimeIssue ? [...previewIssues, runtimeIssue] : previewIssues;
  previewError.textContent = issues.join('\n');
  previewError.hidden = !issues.length;
}

function updatePreview(message: Extract<HostMessage, { type: 'preview' }>) {
  if (message.revision <= revision) return;
  revision = message.revision;
  previewKey = message.key;
  clearCheck();
  previewIssues = message.issues;
  reportPreview();
  const fresh = frame.cloneNode(false) as HTMLIFrameElement;
  fresh.srcdoc = message.html;
  frame.replaceWith(fresh);
  frame = fresh;
}

function runOne(html: string, rule: Check, signal: AbortSignal): Promise<CheckResult | undefined> {
  return new Promise((resolve) => {
    const sandbox = document.createElement('iframe');
    sandbox.className = 'test-frame';
    sandbox.style.width = `${rule.viewport ?? 480}px`;
    sandbox.setAttribute('sandbox', sandboxPermissions);
    sandbox.setAttribute('aria-hidden', 'true');
    sandbox.tabIndex = -1;
    sandbox.referrerPolicy = 'no-referrer';
    const channel = new MessageChannel();
    let started = false;
    const timer = setTimeout(() => finish({ passed: false, detail: '页面运行超时，请检查是否有执行时间过长的代码。' }), checkTimeout(rule));
    const abort = () => finish(undefined);
    function finish(result: CheckResult | undefined) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      signal.removeEventListener('abort', abort);
      channel.port1.close();
      sandbox.remove();
      resolve(result);
    }
    function onMessage(event: MessageEvent) {
      if (started || event.source !== sandbox.contentWindow || event.data?.type !== 'ready') return;
      started = true;
      sandbox.contentWindow!.postMessage({ type: 'check', rule }, '*', [channel.port2]);
    }
    signal.addEventListener('abort', abort, { once: true });
    window.addEventListener('message', onMessage);
    channel.port1.onmessage = (event: MessageEvent<CheckResult>) => finish(event.data);
    document.body.append(sandbox);
    // Resolve the frame width before the HTML parser selects picture sources.
    sandbox.getBoundingClientRect();
    sandbox.srcdoc = html;
  });
}

async function runChecks(message: Extract<HostMessage, { type: 'checking' }>) {
  if (message.revision !== revision) return;
  clearCheck();
  const run = new AbortController();
  checking = run;
  checkButton.disabled = true;
  checkButton.textContent = '正在检查…';
  const results: CheckResult[] = [];
  for (const { html, ...rule } of message.tests) {
    const result = await runOne(html ?? message.html, rule, run.signal);
    if (!result || run.signal.aborted) return;
    results.push(result);
  }
  host.postMessage({ type: 'checked', id: message.id, results });
}

function showResult(message: Extract<HostMessage, { type: 'result' }>) {
  clearCheck();
  assessment.hidden = false;
  assessment.dataset.status = message.status;
  const heading = document.createElement('strong');
  heading.textContent = message.message;
  assessment.replaceChildren(heading);
  if (!message.checks) return;
  const list = document.createElement('ul');
  for (const rule of message.checks) {
    const item = document.createElement('li');
    item.className = rule.passed ? 'check-passed' : 'check-failed';
    item.textContent = `${rule.passed ? '已通过' : '待修改'} · ${rule.label}`;
    if (!rule.passed) {
      const detail = document.createElement('div');
      detail.className = 'check-detail';
      detail.textContent = [rule.detail, rule.hint].filter(Boolean).join(' ');
      item.append(detail);
    }
    list.append(item);
  }
  assessment.append(list);
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source === frame.contentWindow) {
    if (event.data?.type === 'runtime-error' && typeof event.data.message === 'string') {
      reportPreview(event.data.message);
    } else if (event.data?.type === 'local-storage' && previewKey) {
      host.postMessage({ type: 'storage', key: previewKey, entries: event.data.entries });
    }
    return;
  }
  // VS Code replaces window.parent in the panel. The host bridge shares the panel's origin.
  if (event.origin !== window.origin || !event.data) return;
  const message = event.data as HostMessage;
  switch (message.type) {
    case 'lesson': updateLesson(message.lesson); break;
    case 'preview': updatePreview(message); break;
    case 'checking': void runChecks(message); break;
    case 'result': showResult(message); break;
  }
});

checkButton.addEventListener('click', () => host.postMessage({ type: 'check' }));
nextButton.addEventListener('click', () => host.postMessage({ type: 'next' }));
host.postMessage({ type: 'ready' });
