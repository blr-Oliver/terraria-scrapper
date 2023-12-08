import * as fs from 'fs';
import * as path from 'path';
import {fetchHtmlRaw} from './fetch';
import {parallelLimit} from './FloodGate';

export interface EntryInfo {
  htmlRootUrl: string,
  htmlOutputPath: string,
  categories: string,
  lists: string[];
}

type FetchTask = {
  src: string;
  dest: string;
}

export async function fetchLists(entry: EntryInfo): Promise<void> {
  let prepareDest = ensureExists(entry.htmlOutputPath + '/lists');
  let tasks: FetchTask[] = Array(2 + entry.lists.length);
  tasks[0] = {src: entry.categories, dest: entry.categories};
  entry.lists.forEach((list, i) => tasks[i + 1] = {src: list, dest: 'lists/' + list});

  const fetcher = parallelLimit(fetchHtmlRaw, 5, 100);
  const writer = (file: string, content: string) => fs.promises.writeFile(`${entry.htmlOutputPath}/${file}`, content, {encoding: 'utf8'});
  const fails: { [src: string]: any } = {};
  let requests = tasks
      .map(task =>
          fetcher(entry.htmlRootUrl + task.src)
              .then(html => prepareDest
                  .then(() => writer(`${task.dest}.html`, html)))
              .catch(ex => fails[task.dest] = ex));
  await Promise.allSettled(requests);
  if (Object.keys(fails).length > 0)
    await writer('fails.json', JSON.stringify(fails, null, 2));
}

async function ensureExists(dirPath: string): Promise<void> {
  return fs.promises.mkdir(path.normalize(dirPath), {recursive: true}).then();
}