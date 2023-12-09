import {EntryInfo} from '../execution';
import {ensureExists, writeFile} from './common';
import {fetchHtmlRaw} from './fetch';
import {parallelLimit} from './FloodGate';

type FetchTask = {
  src: string;
  dest: string;
}

export async function fetchLists(entry: EntryInfo): Promise<void> {
  let prepareDest = ensureExists(`${entry.out}/html/lists`);
  let tasks: FetchTask[] = Array(2 + entry.lists.length);
  tasks[0] = {src: entry.categories, dest: entry.categories};
  entry.lists.forEach((list, i) => tasks[i + 1] = {src: list, dest: 'lists/' + list});

  const fetcher = parallelLimit(fetchHtmlRaw, 5, 100);
  const fails: { [src: string]: any } = {};
  let requests = tasks
      .map(task =>
          fetcher(entry.htmlRootUrl + task.src)
              .then(html => prepareDest
                  .then(() => writeFile(`${entry.out}/html/${task.dest}.html`, html)))
              .catch(ex => fails[task.dest] = ex));
  await Promise.allSettled(requests);
  if (Object.keys(fails).length > 0)
    await writeFile('fails.json', JSON.stringify(fails, null, 2));
}
