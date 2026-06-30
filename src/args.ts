import { today } from './paths';

export function parseArgs(
  argv: string[],
  defaultLanguage: 'en' | 'zh',
): { command: string; date: string; language: 'en' | 'zh' } {
  const command = argv[0] ?? 'all';
  let date = today();
  let language: 'en' | 'zh' = defaultLanguage;

  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--date') {
      if (i + 1 >= argv.length) throw new Error('--date requires a value');
      date = argv[++i];
    } else if (argv[i] === '--lang') {
      if (i + 1 >= argv.length) throw new Error('--lang requires a value (en|zh)');
      const v = argv[++i];
      if (v !== 'en' && v !== 'zh') throw new Error(`--lang must be en or zh, got ${v}`);
      language = v;
    }
  }

  return { command, date, language };
}
