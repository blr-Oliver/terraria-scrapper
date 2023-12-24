import * as fs from 'fs';
import {ShortInfoCollection} from '../analyze/ShortInfoCollector';
import {EntryInfo} from '../execution';
import {ensureExists} from './common';
import {fetchHtmlRaw, normalizeFileName} from './fetch';
import {parallelLimit} from './FloodGate';

export async function fetchCards(entry: EntryInfo): Promise<void> {
  const collection: ShortInfoCollection = JSON.parse(await fs.promises.readFile(`${entry.out}/json/short-info.json`, {encoding: 'utf8'}));
  await ensureExists(`${entry.out}/html/cards`);
  const queue: Promise<void>[] = [];
  const fetch = parallelLimit(fetchHtmlRaw, 5, 100);
  let items = collection.items;
  for (let key in items) {
    let info = items[key];
    if (!entry.excludeCards.some(x => x.toLowerCase() === key)) {
      let url = entry.htmlRootUrl;
      if (info.page)
        url += info.page;
      else
        url += entry.htmlEntrySuffix + info.name.replaceAll(' ', '_');
      queue.push(
          fetch(url)
              .then(text => fs.promises.writeFile(`${entry.out}/html/cards/${normalizeFileName(info.name)}.html`, text, {encoding: 'utf8'}))
      );
    }
  }
  await Promise.allSettled(queue);
}
