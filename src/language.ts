declare const __WEB_TRAINER_LANGUAGE__: 'en' | 'zh-cn';

export const language = typeof __WEB_TRAINER_LANGUAGE__ !== 'undefined' && __WEB_TRAINER_LANGUAGE__ === 'zh-cn'
  ? 'zh-cn' : 'en';

export function localize(english: string, chinese: string): string {
  return language === 'zh-cn' ? chinese : english;
}

export const extensionName = localize('Web Trainer', '网页闯关');
export const checkAnswer = localize('Check Answer', '检查答案');
