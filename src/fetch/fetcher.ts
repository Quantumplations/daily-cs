import Firecrawl from '@mendable/firecrawl-js';
import type { RawArticle } from './types';

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export function transformSearchResults(results: unknown[]): RawArticle[] {
  return (results ?? [])
    .filter((r): r is Record<string, any> => !!r && typeof r === 'object' && typeof (r as any).url === 'string')
    .map((r) => ({
      title: r.title ?? r.metadata?.title ?? 'Untitled',
      url: r.url,
      content: r.markdown ?? r.description ?? '',
      source: hostnameOf(r.url),
      publishedAt: r.metadata?.publishedTime,
      imageUrl: r.metadata?.ogImage,
    }));
}

export async function searchNews(apiKey: string, query: string, limit: number): Promise<RawArticle[]> {
  const app = new Firecrawl({ apiKey });
  const res: any = await app.search(query, {
    limit,
    scrapeOptions: { formats: ['markdown'] },
  });
  const data = res?.data ?? res?.web ?? res;
  return transformSearchResults(Array.isArray(data) ? data : []);
}
