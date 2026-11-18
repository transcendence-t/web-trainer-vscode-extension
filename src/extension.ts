import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as vscode from 'vscode';
import { loadCourse, loadImportedCourses } from './course';
import { extensionName, language, localize } from './language';
import type { Course, Level, Section } from './model';
import { isUnlocked, orderedLevels } from './progress';
import { Session } from './session';

type CourseNode =
  | { kind: 'course'; course: Course }
  | { kind: 'section'; course: Course; section: Section }
  | { kind: 'level'; course: Course; level: Level };

class CourseTree implements vscode.TreeDataProvider<CourseNode> {
  readonly onDidChangeTreeData: vscode.Event<void>;

  constructor(private readonly session: Session) {
    this.onDidChangeTreeData = session.onDidChange;
  }

  getChildren(node?: CourseNode): CourseNode[] {
    if (!node) return this.session.courses().map((course) => ({ kind: 'course', course }));
    if (node.kind === 'course') return node.course.sections.map((section) => ({ kind: 'section', course: node.course, section }));
    if (node.kind === 'section') return node.section.levels.map((level) => ({ kind: 'level', course: node.course, level }));
    return [];
  }

  getParent(node: CourseNode): CourseNode | undefined {
    if (node.kind === 'level') {
      const section = node.course.sections.find((entry) => entry.levels.includes(node.level))!;
      return { kind: 'section', course: node.course, section };
    }
    if (node.kind === 'section') return { kind: 'course', course: node.course };
  }

  getTreeItem(node: CourseNode): vscode.TreeItem {
    const completed = this.session.completed(node.course.id);
    if (node.kind === 'course' || node.kind === 'section') {
      const isCourse = node.kind === 'course';
      const levelList = isCourse ? orderedLevels(node.course) : node.section.levels;
      const count = levelList.filter((level) => completed.includes(level.id)).length;
      const expanded = isCourse || node.course.sections[0] === node.section;
      const item = new vscode.TreeItem(isCourse ? node.course.title : node.section.title,
        expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
      item.id = isCourse ? node.course.id : `${node.course.id}/section/${node.section.id}`;
      item.iconPath = new vscode.ThemeIcon(isCourse ? 'book' : 'symbol-folder');
      item.description = `${count} / ${levelList.length}`;
      return item;
    }
    const levels = orderedLevels(node.course);
    const item = new vscode.TreeItem(`${levels.indexOf(node.level) + 1}. ${node.level.title}`);
    item.id = `${node.course.id}/level/${node.level.id}`;
    const passed = completed.includes(node.level.id);
    const unlocked = isUnlocked(node.course, completed, node.level.id);
    item.iconPath = new vscode.ThemeIcon(passed ? 'pass-filled' : unlocked ? 'circle-large-outline' : 'lock');
    item.description = passed ? localize('Passed', '已通关') : unlocked ? localize('Available', '可练习') : localize('Locked', '未解锁');
    item.tooltip = unlocked ? node.level.summary : localize('Pass the preceding lessons to unlock this one.', '通过前面的关卡后解锁。');
    if (unlocked) item.command = {
      command: 'webTrainer.openLesson', title: localize('Open Lesson', '打开关卡'), arguments: [node.course.id, node.level.id],
    };
    return item;
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const courseDirectory = language === 'zh-cn' ? 'web-foundations-zh-cn' : 'web-foundations';
  const [builtIn, imported, runner] = await Promise.all([
    loadCourse(join(context.extensionPath, 'courses', courseDirectory, 'course.json')),
    loadImportedCourses(join(context.globalStorageUri.fsPath, 'courses')).catch((error: Error) => {
      void vscode.window.showWarningMessage(localize(
        `${extensionName}: Could not load imported courses (${error.message})`,
        `${extensionName}：无法载入导入的课程（${error.message}）`,
      ));
      return [];
    }),
    readFile(join(context.extensionPath, 'out', 'runner.js'), 'utf8'),
  ]);
  const session = new Session(context, [builtIn, ...imported], runner, (course, level) =>
    courseView.reveal({ kind: 'level', course, level }));
  const courseView: vscode.TreeView<CourseNode> = vscode.window.createTreeView('webTrainer.courses', { treeDataProvider: new CourseTree(session) });
  context.subscriptions.push(session, courseView);
  const commands = {
    start: () => session.start(),
    openLesson: (course: string, level: string) => session.open(course, level),
    check: () => session.check(),
    importCourse: () => session.importCourse(),
    exportCourse: () => session.exportCourse(),
    revealFiles: () => session.revealFiles(),
  };
  for (const [id, action] of Object.entries(commands)) {
    context.subscriptions.push(vscode.commands.registerCommand(`webTrainer.${id}`, (...parameters: [string, string]) =>
      session.run(() => action(...parameters))));
  }
}
