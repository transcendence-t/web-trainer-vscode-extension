import type { Course, Level } from './model';

export function orderedLevels(course: Course): Level[] {
  return course.sections.flatMap((section) => section.levels);
}

export function firstUnfinished(course: Course, completed: readonly string[]): Level | undefined {
  return orderedLevels(course).find((level) => !completed.includes(level.id));
}

export function isUnlocked(course: Course, completed: readonly string[], levelId: string): boolean {
  return orderedLevels(course).some((level) => level.id === levelId)
    && (course.navigation === 'free' || completed.includes(levelId) || firstUnfinished(course, completed)?.id === levelId);
}
