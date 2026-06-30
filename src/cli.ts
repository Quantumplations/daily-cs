import { loadConfig } from './config';
import { today } from './paths';
import { runFetch } from './fetch/index';
import { runSummarize } from './summarize/index';
import { runRender } from './render/index';

type Args = { command: string; date: string; language: 'en' | 'zh' };

function parseArgs(argv: string[]): Args {
  const command = argv[0] ?? 'all';
  const cfg = loadConfig();
  let date = today();
  let language: 'en' | 'zh' = cfg.language;
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--date') date = argv[++i];
    else if (argv[i] === '--lang') {
      const v = argv[++i];
      if (v !== 'en' && v !== 'zh') throw new Error(`--lang must be en or zh, got ${v}`);
      language = v;
    }
  }
  return { command, date, language };
}

async function main(): Promise<void> {
  const { command, date, language } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'fetch':
      await runFetch({ date });
      break;
    case 'summarize':
      await runSummarize({ date, language });
      break;
    case 'render':
      await runRender({ date });
      break;
    case 'all':
      await runFetch({ date });
      await runSummarize({ date, language });
      await runRender({ date });
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: daily-cs <fetch|summarize|render|all> [--date YYYY-MM-DD] [--lang en|zh]');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
