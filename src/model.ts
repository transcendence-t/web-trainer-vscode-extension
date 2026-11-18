export const lessonFiles = ['index.html', 'style.css', 'script.js'] as const;
export const sandboxPermissions = 'allow-scripts allow-forms';
export type LessonFile = typeof lessonFiles[number];
export type PracticeCode = Record<LessonFile, string>;
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type StorageEntries = [string, string][];
export function storageFits(entries: StorageEntries): boolean {
  return new TextEncoder().encode(JSON.stringify(entries)).byteLength <= 64 * 1024;
}
export const layoutRelations = ['right-of', 'below', 'same-row', 'inside', 'center-x', 'equal-width'] as const;
export type LayoutRelation = typeof layoutRelations[number];
export interface MediaCondition {
  query: string;
  matches: boolean;
}

export interface LessonExample {
  language: 'html' | 'css' | 'javascript';
  code: string;
  note: string;
}

export type Action =
  | { type: 'click'; selector: string }
  | { type: 'input'; selector: string; value: string }
  | { type: 'focus'; selector: string }
  | { type: 'key'; selector: string; key: string }
  | { type: 'finish-motion'; selector: string }
  | { type: 'wait'; ms: number };

export type Expectation =
  | { type: 'exists'; selector: string }
  | { type: 'count'; selector: string; value: number }
  | { type: 'text'; selector: string; value: string }
  | { type: 'attribute'; selector: string; name: string; value: string }
  | { type: 'property'; selector: string; name: string; value: Json }
  | { type: 'style'; selector: string; property: string; value: string; pseudo?: string; media?: MediaCondition }
  | { type: 'layout'; selector: string; relativeTo: string; relation: LayoutRelation }
  | { type: 'function'; name: string; args: Json[]; value: Json }
  | { type: 'storage'; key: string; value: string | null };

export interface Check {
  label: string;
  hint?: string;
  actions?: Action[];
  viewport?: number;
  storage?: Record<string, string>;
  expect: Expectation;
}

export function checkTimeout(rule: Check): number {
  return (rule.actions ?? []).reduce((ms, action) => ms + (action.type === 'wait' ? action.ms : 0), 4000);
}

export interface CheckResult {
  passed: boolean;
  detail?: string;
}

export interface Level {
  id: string;
  title: string;
  focus: LessonFile;
  summary: string;
  goal?: string;
  example?: LessonExample;
  tasks: string[];
  hint?: string;
  starter: PracticeCode;
  solution?: Partial<PracticeCode>;
  tests: Check[];
}

export interface Section {
  id: string;
  title: string;
  levels: Level[];
}

export interface Course {
  id: string;
  title: string;
  navigation?: 'free' | 'sequential';
  sections: Section[];
}

export interface LessonView extends Pick<Level, 'title' | 'focus' | 'summary' | 'goal' | 'example' | 'tasks' | 'hint' | 'solution'> {
  key: string;
  courseTitle: string;
  sectionTitle: string;
  position: number;
  total: number;
  completed: number;
  passed: boolean;
  hasNext: boolean;
}

export type HostMessage =
  | { type: 'lesson'; lesson: LessonView }
  | { type: 'preview'; key: string; revision: number; html: string; issues: string[] }
  | { type: 'checking'; id: number; revision: number; html: string; tests: (Check & { html?: string })[] }
  | { type: 'result'; status: 'passed' | 'failed' | 'error'; message: string; checks?: (Check & CheckResult)[] };

export type PanelMessage =
  | { type: 'ready' | 'check' | 'next' }
  | { type: 'edit'; file: LessonFile }
  | { type: 'storage'; key: string; entries: StorageEntries }
  | { type: 'checked'; id: number; results: CheckResult[] };
