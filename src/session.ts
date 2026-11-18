import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import debounce from 'debounce';
import * as vscode from 'vscode';
import { loadCourse, storeImportedCourse, writeCourse } from './course';
import { extensionName, language, localize } from './language';
import { lessonFiles, storageFits, type CheckResult, type Course, type LessonFile, type Level, type PanelMessage, type StorageEntries } from './model';
import { LessonPanel } from './panel';
import { compilePage } from './preview';
import { firstUnfinished, isUnlocked, orderedLevels } from './progress';

interface ActiveLesson {
  key: string;
  course: Course;
  level: Level;
  directory: string;
}

interface PendingCheck {
  id: number;
  revision: number;
  active: ActiveLesson;
  documents: vscode.TextDocument[];
}

const lastKey = language === 'zh-cn' ? 'lastLesson' : 'lastLesson.en';
type LessonLocation = { course: string; level: string };

export class Session implements vscode.Disposable {
  private readonly change = new vscode.EventEmitter<void>();
  readonly onDidChange = this.change.event;
  private readonly catalog: Map<string, Course>;
  private active?: ActiveLesson;
  private panel?: LessonPanel;
  private pending?: PendingCheck;
  private checkId = 0;
  private revision = 0;
  private queue: Promise<void> = Promise.resolve();
  private readonly schedule = debounce(() => void this.run(() => this.refreshPreview()), 150);
  private readonly documentListener: vscode.Disposable;

  constructor(
    private readonly context: vscode.ExtensionContext,
    courses: Course[],
    private readonly runner: string,
    private readonly selectLesson: (course: Course, level: Level) => Thenable<void>,
  ) {
    this.catalog = new Map(courses.map((course) => [course.id, course]));
    // Text-buffer tracking and debouncing adapted from CodeSwing src/preview/index.ts (MIT).
    this.documentListener = vscode.workspace.onDidChangeTextDocument(({ document, contentChanges }) => {
      if (!this.active || !contentChanges.length) return;
      const active = this.active;
      if (!lessonFiles.some((file) => this.uri(active, file).toString() === document.uri.toString())) return;
      this.revision++;
      this.schedule();
    });
  }

  courses() {
    return [...this.catalog.values()];
  }

  completed(courseId: string) {
    return this.context.globalState.get<string[]>(`progress.${courseId}`, []);
  }

  run(action: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(action).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(localize(`${extensionName}: ${message}`, `${extensionName}：${message}`));
      if (this.pending) {
        this.pending = undefined;
        void this.panel?.post({ type: 'result', status: 'error', message });
      }
    });
    return this.queue;
  }

  async start() {
    const last = this.context.globalState.get<LessonLocation>(lastKey);
    const course = (last && this.catalog.get(last.course)) || this.courses()[0];
    const completed = this.completed(course.id);
    const level = last && course.id === last.course && isUnlocked(course, completed, last.level)
      ? last.level
      : (firstUnfinished(course, completed) ?? orderedLevels(course).at(-1)!).id;
    await this.open(course.id, level);
  }

  async open(courseId: string, levelId: string) {
    const course = this.catalog.get(courseId);
    if (!course) return;
    const level = orderedLevels(course).find((entry) => entry.id === levelId);
    if (!level || !isUnlocked(course, this.completed(courseId), levelId)) {
      void vscode.window.showInformationMessage(localize('Pass the preceding lessons first.', '请先通过前面的关卡。'));
      return;
    }
    const directory = join(this.context.globalStorageUri.fsPath, 'practice', course.id, level.id);
    await mkdir(directory, { recursive: true });
    await Promise.all(lessonFiles.map((file) => writeFile(join(directory, file), level.starter[file], { flag: 'wx' })
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'EEXIST') throw error;
      })));

    this.schedule.clear();
    this.active = { key: `${course.id}/${level.id}`, course, level, directory };
    this.revision++;
    this.pending = undefined;
    await this.edit(level.focus);
    await this.context.globalState.update(lastKey, { course: courseId, level: levelId });
    if (this.panel) {
      this.panel.reveal();
    } else {
      this.panel = new LessonPanel(this.context.extensionUri, (message) => void this.run(() => this.receive(message)), () => {
        this.panel = undefined;
        this.pending = undefined;
      });
    }
    this.panel.showTitle(level.title);
    await this.selectLesson(course, level);
    if (this.panel?.ready) {
      await this.present();
      await this.refreshPreview();
    }
  }

  private uri(active: ActiveLesson, file: LessonFile) {
    return vscode.Uri.file(join(active.directory, file));
  }

  private async edit(file: LessonFile) {
    if (!this.active || !lessonFiles.includes(file)) return;
    const document = await vscode.workspace.openTextDocument(this.uri(this.active, file));
    await vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup');
    await vscode.commands.executeCommand('workbench.action.focusRightGroup');
    if (vscode.window.tabGroups.activeTabGroup.viewColumn === vscode.ViewColumn.One) {
      await vscode.commands.executeCommand('workbench.action.newGroupRight');
    }
    await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Active, preview: true });
  }

  private async receive(message: PanelMessage) {
    switch (message.type) {
      case 'ready':
        await this.present();
        await this.refreshPreview();
        break;
      case 'edit': await this.edit(message.file); break;
      case 'storage': {
        if (!this.active || message.key !== this.active.key) break;
        const entries = message.entries;
        if (!Array.isArray(entries) || !entries.every((entry) => Array.isArray(entry) && entry.length === 2
          && typeof entry[0] === 'string' && typeof entry[1] === 'string') || !storageFits(entries)) break;
        await this.context.globalState.update(this.storageKey(this.active), entries.length ? entries : undefined);
        break;
      }
      case 'check': await this.check(); break;
      case 'checked': await this.finishCheck(message.id, message.results); break;
      case 'next': {
        if (!this.active) return;
        const { course, level } = this.active;
        const next = this.nextLevel();
        if (next && (course.navigation === 'free' || this.completed(course.id).includes(level.id))) await this.open(course.id, next.id);
        break;
      }
    }
  }

  private storageKey(active: ActiveLesson) {
    return `localStorage.${active.course.id}.${active.level.id}`;
  }

  private nextLevel() {
    if (!this.active) return;
    const { course, level } = this.active;
    const levels = orderedLevels(course);
    return levels[levels.findIndex((entry) => entry.id === level.id) + 1];
  }

  private async present() {
    if (!this.panel || !this.active) return;
    const { course, level } = this.active;
    const levels = orderedLevels(course);
    const section = course.sections.find((entry) => entry.levels.includes(level))!;
    const completed = this.completed(course.id);
    const passed = completed.includes(level.id);
    const next = this.nextLevel();
    await this.panel.post({ type: 'lesson', lesson: {
      key: this.active.key, courseTitle: course.title, sectionTitle: section.title,
      position: levels.indexOf(level) + 1, total: levels.length,
      completed: levels.filter((entry) => completed.includes(entry.id)).length,
      title: level.title, focus: level.focus, summary: level.summary, tasks: level.tasks, hint: level.hint,
      goal: level.goal, example: level.example, solution: level.solution,
      passed, hasNext: Boolean(next && (course.navigation === 'free' || passed) && isUnlocked(course, completed, next.id)),
    } });
  }

  private async snapshot() {
    const panel = this.panel;
    const active = this.active;
    const revision = this.revision;
    if (!panel?.ready || !active) return;
    const documents = await Promise.all(lessonFiles.map((file) => vscode.workspace.openTextDocument(this.uri(active, file))));
    if (this.revision !== revision || this.panel !== panel) return;
    const [html, css, js] = documents.map((document) => document.getText());
    const code = { 'index.html': html, 'style.css': css, 'script.js': js };
    const storage = this.context.globalState.get<StorageEntries>(this.storageKey(active), []);
    const compiled = compilePage(code, panel.nonce, this.runner, { storage });
    return { active, panel, revision, documents, code, compiled };
  }

  private async refreshPreview() {
    const snapshot = await this.snapshot();
    if (!snapshot) return;
    if (this.pending && this.pending.revision !== snapshot.revision) this.pending = undefined;
    await snapshot.panel.post({ type: 'preview', key: snapshot.active.key, revision: snapshot.revision, ...snapshot.compiled });
  }

  async check() {
    if (!this.panel) {
      await this.start();
      return;
    }
    if (this.pending?.revision === this.revision) return;
    const snapshot = await this.snapshot();
    if (!snapshot) return;
    const { panel, revision, active, documents, code, compiled } = snapshot;
    await panel.post({ type: 'preview', key: active.key, revision, ...compiled });
    if (this.revision !== revision || this.panel !== panel) return;
    if (compiled.issues.length) {
      await panel.post({ type: 'result', status: 'error', message: localize(
        'Fix the JavaScript errors shown in the preview first.', '请先修复预览区显示的 JavaScript 错误。',
      ) });
      return;
    }
    const id = ++this.checkId;
    this.pending = { id, revision, active, documents };
    const functions = [...new Set(active.level.tests.flatMap((rule) => rule.expect.type === 'function' ? [rule.expect.name] : []))];
    const html = compilePage(code, panel.nonce, this.runner, { functions }).html;
    const tests = active.level.tests.map((rule) => rule.storage ? {
      ...rule, html: compilePage(code, panel.nonce, this.runner, { functions, storage: Object.entries(rule.storage) }).html,
    } : rule);
    const delivered = await panel.post({ type: 'checking', id, revision, html, tests });
    if (!delivered) this.pending = undefined;
  }

  private async finishCheck(id: number, results: CheckResult[]) {
    const check = this.pending;
    const panel = this.panel;
    if (!panel || !check || check.id !== id || check.revision !== this.revision) return;
    const { course, level } = check.active;
    if (!Array.isArray(results) || results.length !== level.tests.length) return;
    const checks = level.tests.map((rule, index) => ({
      ...rule, passed: results[index]?.passed === true,
      detail: typeof results[index]?.detail === 'string' ? results[index].detail : undefined,
    }));
    if (checks.some((rule) => !rule.passed)) {
      this.pending = undefined;
      await panel.post({ type: 'result', status: 'failed', message: localize('Some checks still need work.', '还有一些地方需要修改。'), checks });
      return;
    }

    const saved = await Promise.all(check.documents.map((document) => !document.isDirty || document.save()));
    if (check.revision !== this.revision || this.panel !== panel) return;
    if (saved.includes(false)) {
      this.pending = undefined;
      await panel.post({ type: 'result', status: 'error', message: localize(
        'Could not save the practice files. Save them before checking again.', '练习文件保存失败，请保存后重新检查。',
      ) });
      return;
    }
    const completed = new Set(this.completed(course.id));
    completed.add(level.id);
    await this.context.globalState.update(`progress.${course.id}`, [...completed]);
    this.pending = undefined;
    this.change.fire();
    await this.present();
    const allDone = orderedLevels(course).every((entry) => completed.has(entry.id));
    const message = allDone
      ? localize('Course complete!', '课程全部通关！')
      : localize('You passed this lesson. Your code was saved.', '本关通过，代码已保存。');
    await panel.post({ type: 'result', status: 'passed', message, checks });
  }

  async importCourse() {
    const [manifest] = (await vscode.window.showOpenDialog({
      title: localize('Select course.json from the course package', '选择课程包中的 course.json'),
      openLabel: localize('Import Course', '导入课程'), canSelectMany: false,
      filters: { [localize('Course JSON', '课程 JSON')]: ['json'] },
    })) ?? [];
    if (!manifest) return;
    if (manifest.scheme !== 'file') throw new Error(localize('Select a local course file.', '请选择本地课程文件。'));
    const course = await loadCourse(manifest.fsPath);
    await storeImportedCourse(join(this.context.globalStorageUri.fsPath, 'courses'), course);
    const updated = this.catalog.has(course.id);
    const currentLevel = this.active?.course.id === course.id ? this.active.level.id : undefined;
    this.catalog.set(course.id, course);
    this.change.fire();
    const completed = this.completed(course.id);
    const next = firstUnfinished(course, completed) ?? orderedLevels(course).at(-1)!;
    await this.open(course.id, currentLevel && isUnlocked(course, completed, currentLevel) ? currentLevel : next.id);
    void vscode.window.showInformationMessage(updated
      ? localize(`Updated “${course.title}”.`, `「${course.title}」已更新。`)
      : localize(`Imported “${course.title}”.`, `「${course.title}」已导入。`));
  }

  async exportCourse() {
    const course = this.active?.course ?? this.courses()[0];
    const [parent] = (await vscode.window.showOpenDialog({
      title: localize(`Choose where to export “${course.title}”`, `选择「${course.title}」的导出位置`),
      openLabel: localize('Export Course', '导出课程'),
      canSelectFiles: false, canSelectFolders: true, canSelectMany: false,
    })) ?? [];
    if (!parent) return;
    if (parent.scheme !== 'file') throw new Error(localize('Select a local folder.', '请选择本地目录。'));
    await writeCourse(course, parent.fsPath);
    void vscode.window.showInformationMessage(localize(
      `Exported the course to the “${course.id}” subfolder.`, `课程已导出到「${course.id}」子目录。`,
    ));
  }

  async revealFiles() {
    if (!this.active) {
      void vscode.window.showInformationMessage(localize('Open a practice lesson first.', '请先打开一个练习关卡。'));
      return;
    }
    await vscode.commands.executeCommand('revealFileInOS', this.uri(this.active, this.active.level.focus));
  }

  dispose() {
    this.documentListener.dispose();
    this.schedule.clear();
    this.panel?.dispose();
    this.change.dispose();
  }
}
