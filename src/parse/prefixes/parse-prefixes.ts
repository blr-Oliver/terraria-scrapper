import * as fs from 'fs';
import {EntryInfo} from '../../execution';
import {ensureExists} from '../../fetch/common';
import {loadDocument} from '../common';
import {parsePrefixListsFromDocument} from './parse-prefix-lists';

export async function parsePrefixes(entry: EntryInfo): Promise<void> {
  await ensureExists(`${entry.out}/json`);
  let listDoc = await loadDocument(`${entry.out}/html/prefixes/list.html`);
  let prefixList = parsePrefixListsFromDocument(listDoc);
  return fs.promises.writeFile(`${entry.out}/json/prefixes.json`, JSON.stringify(prefixList, null, 2), {encoding: 'utf8'});
}