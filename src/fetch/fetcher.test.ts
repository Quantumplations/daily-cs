import { describe, it, expect } from 'vitest';
import { transformSearchResults } from './fetcher';

describe('transformSearchResults', () => {
  it('maps firecrawl results to RawArticle and derives source host', () => {
    const out = transformSearchResults([
      { url: 'https://www.hltv.org/news/1', title: 'A', markdown: 'body', metadata: { ogImage: 'https://img/1.png' } },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('hltv.org');
    expect(out[0].content).toBe('body');
    expect(out[0].imageUrl).toBe('https://img/1.png');
  });

  it('drops entries without a url', () => {
    const out = transformSearchResults([{ title: 'no url' }, null, { url: 'https://x.com/a', title: 'ok' }]);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe('https://x.com/a');
  });
});
