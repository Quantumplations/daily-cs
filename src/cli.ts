import { loadConfig } from './config';
import { parseArgs } from './args';
import { runFetch } from './fetch/index';
import { runSummarize } from './summarize/index';
import { runRender } from './render/index';

async function main(): Promise<void> {
  const { command, date, language } = parseArgs(process.argv.slice(2), loadConfig().language);
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
