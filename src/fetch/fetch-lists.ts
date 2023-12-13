import {EntryInfo} from '../execution';
import {ensureExists, writeFile} from './common';
import {fetchHtmlRaw, normalizeFileName} from './fetch';
import {parallelLimit} from './FloodGate';

export async function fetchLists(entry: EntryInfo): Promise<void> {
  await ensureExists(`${entry.out}/html/lists`);
  const fetcher = parallelLimit(fetchHtmlRaw, 5, 100);
  const fails: { [src: string]: any } = {};
  let requests = entry.lists
      .map(task =>
          fetcher(entry.htmlRootUrl + entry.htmlEntrySuffix + task)
              .then(html => writeFile(`${entry.out}/html/lists/${normalizeFileName(task)}.html`, html))
              .catch(ex => fails[task] = ex));
  await Promise.allSettled(requests);
  if (Object.keys(fails).length > 0)
    await writeFile('fails.json', JSON.stringify(fails, null, 2));
}
