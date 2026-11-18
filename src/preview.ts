import { parse as parseJavaScript, type Node } from 'acorn';
import { full } from 'acorn-walk';
import { defaultTreeAdapter as tree, html, parse, serialize, type DefaultTreeAdapterTypes } from 'parse5';
import type { PracticeCode, StorageEntries } from './model';

type Element = DefaultTreeAdapterTypes.Element;
type Parent = DefaultTreeAdapterTypes.ParentNode;
type ScriptType = 'script' | 'module';

const loopNodes = new Set(['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement']);
const jsTypes = new Set(['', 'text/javascript', 'application/javascript']);

function instrument(source: string, guard: string, sourceType: ScriptType, resolveImport?: (path: string) => string | undefined): string {
  const changes: [start: number, end: number, text: string][] = [];
  const ast = parseJavaScript(source, { ecmaVersion: 'latest', allowHashBang: true, sourceType });
  if (resolveImport) {
    for (const node of ast.body) {
      if (node.type !== 'ImportDeclaration' && node.type !== 'ExportNamedDeclaration' && node.type !== 'ExportAllDeclaration') continue;
      const specifier = node.source;
      if (typeof specifier?.value !== 'string') continue;
      const url = resolveImport(specifier.value);
      if (url) changes.push([specifier.start, specifier.end, JSON.stringify(url)]);
    }
  }
  full(ast, (node) => {
    if (!loopNodes.has(node.type)) return;
    const body = (node as Node & { body: Node }).body;
    if (body.type === 'BlockStatement') {
      changes.push([body.start + 1, body.start + 1, `${guard}();`]);
    } else {
      changes.push([body.start, body.start, `{${guard}();`], [body.end, body.end, '}']);
    }
  });
  let result = source;
  for (const [start, end, text] of changes.sort(([a], [b]) => b - a)) {
    result = result.slice(0, start) + text + result.slice(end);
  }
  return result;
}

function element(name: string, attributes: Record<string, string>): Element {
  return tree.createElement(name, html.NS.HTML, Object.entries(attributes).map(([name, value]) => ({ name, value })));
}

function dataUrl(type: string, text: string): string {
  return `data:${type};charset=utf-8;base64,${Buffer.from(text, 'utf8').toString('base64')}`;
}

function replace(node: Element, substitution?: Element) {
  const parent = node.parentNode!;
  if (substitution) tree.insertBefore(parent, substitution, node);
  tree.detachNode(node);
}

function attribute(node: Element, name: string): string {
  return node.attrs.find((entry) => entry.name === name)?.value ?? '';
}

function localFile(path: string, name: string): boolean {
  return path.trim().split(/[?#]/, 1)[0].replace(/^\.\//, '') === name;
}

interface PreviewOptions {
  functions?: string[];
  storage?: StorageEntries;
}

export function compilePage(code: PracticeCode, nonce: string, runner: string, options: PreviewOptions = {}): { html: string; issues: string[] } {
  const document = parse(code['index.html'], { sourceCodeLocationInfo: true });
  const root = document.childNodes.find((child) => child.nodeName === 'html') as Element;
  const head = root.childNodes.find((child) => child.nodeName === 'head') as Element;
  let body = root.childNodes.find((child) => child.nodeName === 'body') as Element | undefined;
  if (!body) {
    const frameset = root.childNodes.find((child) => child.nodeName === 'frameset');
    if (frameset) tree.detachNode(frameset);
    body = element('body', {});
    tree.appendChild(root, body);
  }
  const issues: string[] = [];
  const guard = `__webTrainerTick${nonce.replace(/[^a-z0-9]/gi, '')}`;
  let hasCss = false;
  let hasJs = false;

  function scriptUrl(source: string, file: string, line: number, type: ScriptType,
    resolveImport?: (path: string) => string | undefined): string | undefined {
    try {
      const js = '\n'.repeat(line - 1) + instrument(source, guard, type, resolveImport) + `\n//# sourceURL=${file}\n`;
      return dataUrl('application/javascript', js);
    } catch (error) {
      const syntax = error as Error & { loc?: { line: number; column: number } };
      const position = syntax.loc ? ` 第 ${line + syntax.loc.line - 1} 行第 ${syntax.loc.column + 1} 列` : '';
      issues.push(`${file}${position}：JavaScript 语法错误（${syntax.message.replace(/ \(\d+:\d+\)$/, '')}）`);
    }
  }

  function script(source: string, file: string, deferred: boolean, async: boolean, line = 1): Element | undefined {
    if (!source.trim()) return;
    const src = scriptUrl(source, file, line, 'script');
    return src ? element('script', { nonce, crossorigin: 'anonymous', src,
      ...(deferred ? { defer: '' } : {}), ...(async ? { async: '' } : {}),
    }) : undefined;
  }

  let moduleUrl: string | null | undefined;
  function scriptModule(): string | undefined {
    hasJs = true;
    if (moduleUrl === undefined) moduleUrl = scriptUrl(code['script.js'], 'script.js', 1, 'module') ?? null;
    return moduleUrl ?? undefined;
  }

  function visit(container: Parent) {
    for (const node of [...container.childNodes]) {
      if (!tree.isElementNode(node)) continue;
      if (node.tagName === 'link') {
        const stylesheet = attribute(node, 'rel').toLowerCase().split(/\s+/).includes('stylesheet');
        if (stylesheet && localFile(attribute(node, 'href'), 'style.css')) {
          hasCss = true;
          replace(node, element('link', { rel: 'stylesheet', crossorigin: 'anonymous', href: dataUrl('text/css', code['style.css']),
            media: attribute(node, 'media'),
          }));
        } else {
          replace(node);
        }
      } else if (node.tagName === 'script' && node.namespaceURI === html.NS.HTML) {
        const type = attribute(node, 'type').toLowerCase().trim();
        const source = attribute(node, 'src');
        const fromFile = localFile(source, 'script.js');
        const inline = !source ? node.childNodes.filter(tree.isTextNode).map((child) => child.value).join('') : '';
        const line = node.sourceCodeLocation?.startTag?.endLine ?? 1;
        if (type === 'module') {
          const src = fromFile ? scriptModule() : !source
            ? scriptUrl(inline, 'index.html', line, 'module', (path) => path === './script.js' ? scriptModule() : undefined)
            : undefined;
          replace(node, src ? element('script', { nonce, crossorigin: 'anonymous', type: 'module', src,
            ...(node.attrs.some((attr) => attr.name === 'async') ? { async: '' } : {}),
          }) : undefined);
        } else if (jsTypes.has(type)) {
          hasJs ||= fromFile;
          replace(node, fromFile
            ? script(code['script.js'], 'script.js', node.attrs.some((attr) => attr.name === 'defer'), node.attrs.some((attr) => attr.name === 'async'))
            : script(inline, 'index.html', false, false, line));
        }
      } else if (['base', 'iframe', 'object', 'embed'].includes(node.tagName)
        || (node.tagName === 'meta' && attribute(node, 'http-equiv'))) {
        replace(node);
      } else {
        visit(node);
      }
    }
  }

  visit(head);
  visit(body);
  if (!hasCss && code['style.css'].trim()) {
    tree.appendChild(head, element('link', { rel: 'stylesheet', crossorigin: 'anonymous', href: dataUrl('text/css', code['style.css']) }));
  }
  if (!hasJs) {
    const js = script(code['script.js'], 'script.js', false, false);
    if (js) tree.appendChild(body, js);
  }

  if (!document.childNodes.some(tree.isDocumentTypeNode)) {
    tree.setDocumentType(document, 'html', '', '');
    const doctype = document.childNodes.at(-1)!;
    tree.detachNode(doctype);
    tree.insertBefore(document, doctype, root);
  }
  const policy = element('meta', { 'http-equiv': 'Content-Security-Policy', content: [
    "default-src 'none'", `script-src 'nonce-${nonce}'`, "style-src 'unsafe-inline' data:",
    'img-src data:', 'font-src data:', 'media-src data:', 'connect-src data:', "base-uri 'none'", "form-action 'none'",
  ].join('; ') });
  // A nonce permits any URL in the first policy. The second policy restricts script URLs to local data.
  const scriptPolicy = element('meta', { 'http-equiv': 'Content-Security-Policy', content: "script-src 'unsafe-inline' data:" });
  const bootstrap = element('script', { nonce, 'data-guard': guard, 'data-storage': JSON.stringify(options.storage ?? []) });
  // A classic script can read global lexical bindings declared by other classic scripts after they load.
  const functions = (options.functions ?? []).filter((name) => /^[a-z_$][a-z0-9_$]*$/i.test(name));
  const readers = functions.map((name) => `[${JSON.stringify(name)}, () => typeof ${name} === 'function' ? ${name} : undefined]`);
  const resolver = readers.length ? `\nwindow.${guard}Resolve = new Map([${readers.join(',\n')}]);` : '';
  tree.insertText(bootstrap, runner + resolver);
  const first = head.childNodes[0];
  for (const node of [policy, scriptPolicy, bootstrap]) {
    if (first) tree.insertBefore(head, node, first);
    else tree.appendChild(head, node);
  }
  return { html: serialize(document), issues };
}
