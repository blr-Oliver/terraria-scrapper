import * as fs from 'fs';
import {EntryInfo} from '../execution';
import {ParsedSection} from '../parse/common';
import {ListIndexBuilder} from './ListIndexBuilder';

export async function buildListIndex(entry: EntryInfo): Promise<void> {
  let builder = new ListIndexBuilder();
  let queue: Promise<void>[] = entry.lists.map(list => processList(entry, list, builder));
  await Promise.allSettled(queue);
  builder.finish();
  return fs.promises.writeFile(`${entry.out}/json/listIndex.json`, JSON.stringify(builder.data, null, 2), {encoding: 'utf8'});
}

async function processList(entry: EntryInfo, list: string, builder: ListIndexBuilder) {
  let text = await fs.promises.readFile(`${entry.out}/json/lists/${list}.json`, {encoding: 'utf8'});
  let data = JSON.parse(text) as ParsedSection[];
  for (let section of data) {
    for (let item of section.items)
      builder.collect(item);
  }
}