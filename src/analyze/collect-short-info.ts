import * as fs from 'fs';
import {EntryInfo} from '../execution';
import {ParsedSection} from '../parse/common';
import {ItemCategoryInfo} from './flatten-categories';
import {ShortInfoBuilder} from './ShortInfoBuilder';

export async function collectShortInfo(entry: EntryInfo): Promise<void> {
  const categories: { [name: string]: ItemCategoryInfo } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/category-info.json`, {encoding: 'utf8'}));
  const builder = new ShortInfoBuilder();
  for (let name in categories) {
    builder.collectCategoryInfo(categories[name]);
  }
  await Promise.allSettled(entry.lists.map(list => processList(list, entry, builder)));
  builder.finish();
  return fs.promises.writeFile(`${entry.out}/json/short-info.json`, JSON.stringify(builder.data, null, 2), {encoding: 'utf8'});
}

async function processList(list: string, entry: EntryInfo, builder: ShortInfoBuilder): Promise<void> {
  let content: ParsedSection[] = JSON.parse(await fs.promises.readFile(`${entry.out}/json/lists/${list}.json`, {encoding: 'utf8'}));
  for (let section of content) {
    for (let item of section.items) {
      builder.collectListInfo(item);
    }
  }
}