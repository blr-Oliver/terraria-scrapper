import * as fs from 'fs';
import {EntryInfo} from '../execution';
import {ParsedSection} from '../parse/common';
import {Category} from '../parse/parse-categories';
import {ShortInfoCollector} from './ShortInfoCollector';

export async function collectPages(entry: EntryInfo): Promise<void> {
  const collector: ShortInfoCollector = new ShortInfoCollector();
  const rootCategory: Category = JSON.parse(await fs.promises.readFile(`${entry.out}/json/categories.json`, {encoding: 'utf8'}));
  collectCategoriesRecursively(collector, rootCategory);
  let listTasks = entry.lists
      .map(listName => fs.promises.readFile(`${entry.out}/json/lists/${listName}.json`, {encoding: 'utf8'})
          .then(str => JSON.parse(str) as ParsedSection[])
          .then(data => collector.collect(data)));
  await Promise.all(listTasks);
  return fs.promises.writeFile(`${entry.out}/json/short-info.json`, JSON.stringify(collector, null, 2), {encoding: 'utf8'});
}

function collectCategoriesRecursively(collector: ShortInfoCollector, category: Category) {
  if (category.items) {
    for (let item of category.items)
      collector.collectDirectly({
        name: item.name,
        page: item.href
      });
  }
  if (category.categories) {
    for (let child of category.categories)
      collectCategoriesRecursively(collector, child);
  }
}