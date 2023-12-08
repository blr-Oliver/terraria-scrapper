import {EntryInfo} from '../execution';
import {ensureExists, writeFile} from './common';
import {fetchHtmlRaw} from './fetch';

export async function fetchCategories(entry: EntryInfo): Promise<void> {
  await ensureExists(entry.htmlOutputPath);
  return fetchHtmlRaw(entry.htmlRootUrl + entry.categories)
      .then(html => writeFile(`${entry.htmlOutputPath}/${entry.categories}.html`, html));
}