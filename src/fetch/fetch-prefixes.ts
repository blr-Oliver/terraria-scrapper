import {EntryInfo} from '../execution';
import {ensureExists, writeFile} from './common';
import {fetchHtmlRaw} from './fetch';

export async function fetchPrefixes(entry: EntryInfo): Promise<void> {
  await ensureExists(`${entry.out}/html/prefixes`);
  let [listContent, idsContent] = await Promise.all([
    fetchHtmlRaw(entry.htmlRootUrl + entry.htmlEntrySuffix + entry.prefixes.list),
    fetchHtmlRaw(entry.htmlRootUrl + entry.htmlEntrySuffix + entry.prefixes.ids)
  ]);
  await Promise.all([
    writeFile(`${entry.out}/html/prefixes/list.html`, listContent),
    writeFile(`${entry.out}/html/prefixes/ids.html`, idsContent)]
  );
}