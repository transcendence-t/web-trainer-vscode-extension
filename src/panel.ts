import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import { checkAnswer, extensionName, localize } from './language';
import { sandboxPermissions, type HostMessage, type PanelMessage } from './model';

export class LessonPanel {
  readonly nonce = randomBytes(18).toString('hex');
  private readonly panel: vscode.WebviewPanel;
  ready = false;

  constructor(extensionUri: vscode.Uri, receive: (message: PanelMessage) => void, closed: () => void) {
    const media = vscode.Uri.joinPath(extensionUri, 'media');
    const out = vscode.Uri.joinPath(extensionUri, 'out');
    this.panel = vscode.window.createWebviewPanel('webTrainer.lesson', extensionName, {
      viewColumn: vscode.ViewColumn.One, preserveFocus: true,
    }, { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [media, out] });
    this.panel.onDidDispose(closed);
    this.panel.webview.onDidReceiveMessage((message: PanelMessage) => {
      if (message.type === 'ready') this.ready = true;
      receive(message);
    });

    const webview = this.panel.webview;
    const script = webview.asWebviewUri(vscode.Uri.joinPath(out, 'ui.js'));
    const stylesheet = webview.asWebviewUri(vscode.Uri.joinPath(media, 'panel.css'));
    const csp = [
      "default-src 'none'", `script-src 'nonce-${this.nonce}'`,
      `style-src ${webview.cspSource} 'unsafe-inline' data:`,
      'img-src data:', 'font-src data:', 'media-src data:', 'connect-src data:', "frame-src 'self' about:",
      "base-uri 'none'", "form-action 'none'",
    ].join('; ');

    this.panel.webview.html = `<!doctype html>
<html lang="${localize('en', 'zh-CN')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="stylesheet" href="${stylesheet}">
  <title>${extensionName}</title>
</head>
<body>
  <p id="loading" role="status">${localize('Opening lesson…', '正在打开关卡…')}</p>
  <main id="activity" hidden>
    <section class="lesson" aria-labelledby="lesson-title">
      <div class="course-line">
        <span class="course-name" id="course-title"></span>
        <span class="position" id="position"></span>
      </div>
      <progress id="progress" aria-label="${localize('Course progress', '课程进度')}"></progress>
      <h1 id="lesson-title"></h1>
      <p id="goal" class="goal" hidden></p>
      <p id="summary" class="summary"></p>
      <ol id="tasks"></ol>
      <details id="example" class="hint lesson-code" hidden>
        <summary>${localize('Code Example', '代码示例')}</summary>
        <p id="example-note"></p>
        <pre><code id="example-code"></code></pre>
      </details>
      <details id="hint" class="hint" hidden>
        <summary>${localize('Show Hint', '查看提示')}</summary>
        <p id="hint-text"></p>
      </details>
      <div id="files" class="files" role="group" aria-label="${localize('Open practice files in the editor', '在编辑器中打开练习文件')}"></div>
      <div class="actions">
        <button id="check" class="primary" type="button">${checkAnswer}</button>
        <button id="next" class="secondary" type="button" hidden>${localize('Next Lesson', '下一关')} <span aria-hidden="true">→</span></button>
        <span id="passed" class="passed" hidden>✓ ${localize('Passed', '已通关')}</span>
      </div>
      <div id="assessment" class="assessment" role="status" aria-live="polite" hidden></div>
      <details id="solution" class="hint lesson-code solution" hidden>
        <summary>${localize('Sample Solution', '参考答案')}</summary>
        <div id="solution-files"></div>
      </details>
    </section>
    <section class="preview" aria-labelledby="preview-title">
      <div class="preview-heading">
        <h2 id="preview-title">${localize('Page Preview', '网页预览')}</h2>
        <span class="live">${localize('Live', '实时更新')}</span>
      </div>
      <p id="preview-error" class="preview-error" role="status" hidden></p>
      <iframe id="preview-frame" title="${localize('Live page preview', '实时网页预览')}" sandbox="${sandboxPermissions}" referrerpolicy="no-referrer"></iframe>
    </section>
  </main>
  <script nonce="${this.nonce}" src="${script}"></script>
</body>
</html>`;
  }

  reveal() {
    this.panel.reveal(vscode.ViewColumn.One, true);
  }

  showTitle(title: string) {
    this.panel.title = `${extensionName} · ${title}`;
  }

  post(message: HostMessage) {
    return this.panel.webview.postMessage(message);
  }

  dispose() {
    this.panel.dispose();
  }
}
