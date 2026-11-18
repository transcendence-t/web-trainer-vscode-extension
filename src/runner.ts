import { storageFits, type Action, type Check, type CheckResult, type Expectation, type Json, type LayoutRelation, type MediaCondition, type StorageEntries } from './model';

const notify = parent.postMessage.bind(parent);
const bootstrap = (document.currentScript as HTMLScriptElement).dataset;
const tickName = bootstrap.guard!;
let values = new Map<string, string>(JSON.parse(bootstrap.storage ?? '[]') as StorageEntries);

function changeStorage(next: Map<string, string>) {
  const entries = [...next];
  if (!storageFits(entries)) throw new DOMException('本关本地存储已满。', 'QuotaExceededError');
  values = next;
  notify({ type: 'local-storage', entries }, '*');
}

// An opaque iframe cannot read the shared browser storage of the VS Code Webview.
Object.defineProperty(window, 'localStorage', { value: Object.freeze({
  get length() { return values.size; },
  key: (index: number) => [...values.keys()][index] ?? null,
  getItem: (key: string) => values.get(String(key)) ?? null,
  setItem: (key: string, value: string) => changeStorage(new Map(values).set(String(key), String(value))),
  removeItem: (key: string) => {
    if (!values.has(String(key))) return;
    const next = new Map(values);
    next.delete(String(key));
    changeStorage(next);
  },
  clear: () => changeStorage(new Map()),
}) });
let ticks = 0;
let deadline = 0;
Object.defineProperty(window, tickName, { value: () => {
  if (!ticks) {
    deadline = performance.now() + 400;
    setTimeout(() => { ticks = 0; }, 0);
  }
  if (++ticks > 100_000 || performance.now() > deadline) {
    throw new Error('循环执行时间过长，请检查循环结束条件。');
  }
} });

let firstError: string | undefined;
function reportError(message: string) {
  if (firstError) return;
  firstError = message.slice(0, 500);
  notify({ type: 'runtime-error', message: firstError }, '*');
}

window.addEventListener('error', (event) => {
  if (!event.message) return;
  const file = event.filename.split('/').at(-1);
  const position = file && !file.startsWith('data:') ? `${file} 第 ${event.lineno} 行：` : '';
  reportError(`${position}${event.message.replace(/^Uncaught (?:\(in promise\) )?/, '')}`);
});
window.addEventListener('unhandledrejection', (event) => {
  reportError(`异步代码出错：${String(event.reason)}`);
});

document.addEventListener('submit', (event) => event.preventDefault());
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || !(event.target instanceof Element)) return;
  const anchor = event.target.closest('a[href], area[href]');
  if (!anchor) return;
  const href = anchor.getAttribute('href')!.trim();
  event.preventDefault();
  if (href.startsWith('#')) location.hash = href;
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForViewport(width: number): Promise<void> {
  const end = performance.now() + 1000;
  while (Math.abs(window.innerWidth - width) > 1) {
    if (performance.now() >= end) throw new Error(`判题视口应为 ${width}px，实际为 ${window.innerWidth}px。`);
    await delay(20);
  }
}

async function act(action: Action) {
  if (action.type === 'wait') return delay(action.ms);
  const target = findElements(action.selector)[0];
  if (!(target instanceof HTMLElement)) throw new Error(`找不到可操作的元素 ${action.selector}。`);
  switch (action.type) {
    case 'click': target.click(); break;
    case 'focus': target.focus({ preventScroll: true }); break;
    case 'key': target.dispatchEvent(new KeyboardEvent('keydown', { key: action.key, bubbles: true, cancelable: true })); break;
    case 'finish-motion':
      // Force the first style update before querying animations in a hidden frame.
      target.getBoundingClientRect();
      for (const animation of target.getAnimations()) animation.finish();
      break;
    case 'input': {
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        throw new Error(`${action.selector} 需要是 input、textarea 或 select。`);
      }
      target.value = action.value;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      if (target instanceof HTMLSelectElement) target.dispatchEvent(new Event('change', { bubbles: true }));
      break;
    }
  }
  await delay(0);
}

function compact(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function compare(expected: string | number, actual: string | number | null): CheckResult {
  if (expected === actual) return { passed: true };
  return { passed: false, detail: `预期「${expected}」，实际${actual === null ? '缺少该属性' : `为「${String(actual).slice(0, 180)}」`}。` };
}

function findElements(selector: string): NodeListOf<Element> {
  try {
    return document.querySelectorAll(selector);
  } catch {
    throw new Error(`课程判题规则中的选择器无效「${selector}」。`);
  }
}

function setMediaCondition({ query, matches }: MediaCondition): boolean {
  const normalized = matchMedia(query).media;
  let found = false;
  function visit(rules: CSSRuleList) {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule && rule.media.mediaText === normalized) {
        rule.media.mediaText = matches ? 'all' : 'not all';
        found = true;
      }
      if (rule instanceof CSSGroupingRule || rule instanceof CSSStyleRule) visit(rule.cssRules);
    }
  }
  for (const sheet of document.styleSheets) {
    if (sheet.ownerNode instanceof HTMLLinkElement && sheet.ownerNode.crossOrigin !== 'anonymous') continue;
    visit(sheet.cssRules);
  }
  return found;
}

function judgeStyle(target: Element, { property, value, pseudo, media }: Extract<Expectation, { type: 'style' }>): CheckResult {
  if (media && !setMediaCondition(media)) return { passed: false, detail: `找不到 @media ${media.query}。` };
  const style = getComputedStyle(target, pseudo);
  const actual = style.getPropertyValue(property).trim();
  const border = property === 'border' || /^border-(?:(?:top|right|bottom|left|block|inline)(?:-start|-end)?(?:-width)?|width)$/.test(property);
  const outline = ['outline', 'outline-width', 'outline-offset'].includes(property);
  if (actual === value || (!border && !outline) || !CSS.supports(property, value)) return compare(value, actual);

  // The browser snaps border and outline lengths to device pixels. Measure the expected value in the same document.
  const reference = document.createElement('div');
  reference.style.setProperty('all', 'initial', 'important');
  reference.style.setProperty('position', 'absolute', 'important');
  reference.style.setProperty('visibility', 'hidden', 'important');
  reference.style.setProperty('zoom', style.getPropertyValue('zoom'), 'important');
  reference.style.setProperty(outline ? 'outline-style' : 'border-style', 'solid', 'important');
  reference.style.setProperty(property, value, 'important');
  (target.parentElement ?? document.body).append(reference);
  const expected = getComputedStyle(reference).getPropertyValue(property).trim();
  reference.remove();
  return expected === actual ? { passed: true } : compare(value, actual);
}

function layoutMatches(relation: LayoutRelation, a: DOMRect, b: DOMRect): boolean {
  const near = (x: number, y: number) => Math.abs(x - y) <= 2;
  if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return false;
  switch (relation) {
    case 'right-of': return a.left >= b.right - 1 && a.top < b.bottom && b.top < a.bottom;
    case 'below': return a.top >= b.bottom - 1;
    case 'same-row': return near(a.top, b.top);
    case 'inside': return a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    case 'center-x': return near(a.left + a.width / 2, b.left + b.width / 2);
    case 'equal-width': return near(a.width, b.width);
  }
}

function sameValue(actual: unknown, expected: Json): boolean {
  if (expected === null || typeof expected !== 'object') return actual === expected;
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && actual.length === expected.length && expected.every((item, index) => sameValue(actual[index], item));
  }
  if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) return false;
  const entries = Object.entries(expected);
  return Object.keys(actual).length === entries.length && entries.every(([key, item]) =>
    Object.hasOwn(actual, key) && sameValue((actual as Record<string, unknown>)[key], item));
}

function describe(value: unknown): string {
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  try { return (JSON.stringify(value) ?? String(value)).slice(0, 180); }
  catch { return String(value).slice(0, 180); }
}

async function judge(expect: Expectation): Promise<CheckResult> {
  if (expect.type === 'storage') {
    const actual = localStorage.getItem(expect.key);
    return actual === expect.value ? { passed: true } : { passed: false,
      detail: `存储键「${expect.key}」预期 ${describe(expect.value)}，实际 ${describe(actual)}。`,
    };
  }
  if (expect.type === 'function') {
    type FunctionReader = () => ((...args: Json[]) => unknown) | undefined;
    const globals = window as unknown as Record<string, Map<string, FunctionReader> | undefined>;
    const fn = globals[`${tickName}Resolve`]?.get(expect.name)?.();
    if (!fn) return { passed: false, detail: `找不到函数 ${expect.name}，请在 script.js 顶层定义它。` };
    const args = expect.args.map(describe).join(', ');
    const result = await fn(...expect.args);
    return sameValue(result, expect.value) ? { passed: true } : { passed: false,
      detail: `${expect.name}(${args}) 预期返回 ${describe(expect.value)}，实际返回 ${describe(result)}。`,
    };
  }
  const targets = findElements(expect.selector);
  if (expect.type === 'count') return compare(expect.value, targets.length);
  const [element] = targets;
  if (!element) return { passed: false, detail: `找不到 ${expect.selector}。` };
  switch (expect.type) {
    case 'exists': return { passed: true };
    case 'text': return compare(compact(expect.value), compact(element.textContent ?? ''));
    case 'attribute': return compare(expect.value, element.getAttribute(expect.name));
    case 'property': {
      const actual: unknown = Reflect.get(element, expect.name);
      return sameValue(actual, expect.value) ? { passed: true } : { passed: false,
        detail: `属性 ${expect.name} 预期 ${describe(expect.value)}，实际为 ${describe(actual)}。`,
      };
    }
    case 'style': return judgeStyle(element, expect);
    case 'layout': {
      const other = findElements(expect.relativeTo)[0];
      if (!other) return { passed: false, detail: `找不到参照元素 ${expect.relativeTo}。` };
      const descriptions: Record<LayoutRelation, string> = {
        'right-of': '在右侧并处于同一行', below: '在下方', 'same-row': '在同一行',
        inside: '完全位于内部', 'center-x': '水平居中对齐', 'equal-width': '宽度相同',
      };
      return layoutMatches(expect.relation, element.getBoundingClientRect(), other.getBoundingClientRect())
        ? { passed: true }
        : { passed: false, detail: `预期 ${expect.selector} 相对于 ${expect.relativeTo} ${descriptions[expect.relation]}。` };
    }
  }
}

window.addEventListener('message', (event: MessageEvent<{ type: string; rule: Check }>) => {
  if (event.source !== parent || event.data?.type !== 'check' || !event.ports[0]) return;
  event.stopImmediatePropagation();
  const port = event.ports[0];
  const { rule } = event.data;
  void (async () => {
    let result: CheckResult;
    try {
      if (rule.viewport !== undefined) await waitForViewport(rule.viewport);
      if (firstError) throw new Error(firstError);
      for (const action of rule.actions ?? []) {
        await act(action);
        if (firstError) throw new Error(firstError);
      }
      result = await judge(rule.expect);
    } catch (error) {
      result = { passed: false, detail: error instanceof Error ? error.message : String(error) };
    }
    port.postMessage(result);
    port.close();
  })();
}, true);

window.addEventListener('load', () => {
  setTimeout(() => notify({ type: 'ready' }, '*'), 0);
}, { once: true });
