import {EntryInfo} from '../execution';
import {ensureExists, writeFile} from './common';
import {fetchHtmlRaw} from './fetch';

export async function fetchCategories(entry: EntryInfo): Promise<void> {
  await ensureExists(`${entry.out}/html`);

  return fetchHtmlRaw(entry.htmlRootUrl + entry.htmlEntrySuffix + entry.categories)
      .then(html => writeFile(`${entry.out}/html/${entry.categories}.html`, html));
}