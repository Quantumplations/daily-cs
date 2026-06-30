import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { loadConfig } from '../config';
import { parseStoryboard } from '../schema';
import { storyboardPath, outPath, OUT_DIR, FIXTURE_STORYBOARD } from '../paths';

export async function runRender(opts: { date: string }): Promise<string> {
  const cfg = loadConfig();
  const dated = storyboardPath(opts.date);
  const sbFile = fs.existsSync(dated) ? dated : FIXTURE_STORYBOARD;
  const storyboard = parseStoryboard(JSON.parse(fs.readFileSync(sbFile, 'utf8')));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const serveUrl = await bundle({
    entryPoint: path.resolve('remotion/index.ts'),
    publicDir: path.resolve('public'),
  });
  const inputProps = { ...storyboard, music: cfg.music };
  const composition = await selectComposition({ serveUrl, id: 'DailyCS', inputProps });

  const output = outPath(opts.date);
  await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: output, inputProps });
  console.log(`Rendered ${output} (from ${path.basename(sbFile)})`);
  return output;
}
