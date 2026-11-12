import type { ObjectRecord, Source } from './types';

export interface SourceGroup {
  /** Host name without "www.", e.g. science.nasa.gov. */
  host: string;
  sources: Source[];
}

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, '');

/**
 * Every distinct source cited by the objects, grouped by the site that hosts it.
 * Groups are ordered by how many sources they hold, then by name; sources by title.
 */
export function sourceIndex(objects: readonly Pick<ObjectRecord, 'sources'>[]): SourceGroup[] {
  const byUrl = new Map<string, Source>();
  for (const object of objects) for (const source of object.sources) if (!byUrl.has(source.url)) byUrl.set(source.url, source);

  const byHost = new Map<string, Source[]>();
  for (const source of byUrl.values()) {
    const host = hostOf(source.url);
    byHost.set(host, [...(byHost.get(host) ?? []), source]);
  }

  return [...byHost]
    .map(([host, sources]) => ({ host, sources: sources.sort((a, b) => a.title.localeCompare(b.title)) }))
    .sort((a, b) => b.sources.length - a.sources.length || a.host.localeCompare(b.host));
}

export const countSources = (groups: readonly SourceGroup[]) => groups.reduce((sum, group) => sum + group.sources.length, 0);
