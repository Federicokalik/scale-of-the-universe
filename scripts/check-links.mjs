// Checks that every source address answers.
//   node scripts/check-links.mjs                 -> the sources in src/data/objects.json
//   node scripts/check-links.mjs research/x.json -> the sources in a research file
// A source that cannot be reached is reported; exit code 1 if any fails.
// Some sites refuse automated requests (403/429): those are listed as "refused"
// and need a look by hand rather than counting as broken.
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? new URL('../src/data/objects.json', import.meta.url);
const entries = JSON.parse(readFileSync(file, 'utf8'));
const urls = new Map();
for (const entry of entries) for (const source of entry.sources ?? []) urls.set(source.url, [...(urls.get(source.url) ?? []), entry.id]);

const HEADERS = { 'user-agent': 'Mozilla/5.0 (compatible; link-check)', accept: 'text/html,application/pdf,*/*' };

async function probe(url) {
  try {
    const response = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    await response.body?.cancel();
    return response.status;
  } catch (error) {
    return error.name === 'TimeoutError' ? 'timeout' : 'unreachable';
  }
}

const broken = [];
const refused = [];
const list = [...urls];
const CONCURRENCY = 6;
for (let i = 0; i < list.length; i += CONCURRENCY) {
  await Promise.all(
    list.slice(i, i + CONCURRENCY).map(async ([url, ids]) => {
      const status = await probe(url);
      if (status === 403 || status === 429) refused.push({ url, ids, status });
      else if (typeof status !== 'number' || status >= 400) broken.push({ url, ids, status });
    }),
  );
}

console.log(`${list.length} address(es) checked: ${list.length - broken.length - refused.length} ok, ${refused.length} refused, ${broken.length} broken.`);
for (const { url, ids, status } of refused) console.log(`  refused (${status}) ${url}  <- ${ids.join(', ')}`);
for (const { url, ids, status } of broken) console.error(`  BROKEN (${status}) ${url}  <- ${ids.join(', ')}`);
process.exit(broken.length ? 1 : 0);
