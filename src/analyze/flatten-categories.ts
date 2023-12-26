import * as fs from 'fs';
import {sortKeys} from '../common/utils';
import {EntryInfo} from '../execution';
import {Category} from '../parse/parse-categories';

export interface ItemCategoryInfo {
  name: string;
  page: string;
  categories: string[];
}

export async function flattenCategories(entry: EntryInfo) {
  const rootCategory: Category = JSON.parse(await fs.promises.readFile(`${entry.out}/json/categories.json`, {encoding: 'utf8'}));
  let result: { [name: string]: ItemCategoryInfo } = {};
  traverseCategoryTree(rootCategory, [], result);
  result = sortKeys(result);
  return fs.promises.writeFile(`${entry.out}/json/category-info.json`, JSON.stringify(result, null, 2), {encoding: 'utf8'});
}

function traverseCategoryTree(root: Category, currentPath: string[], collection: { [name: string]: ItemCategoryInfo }) {
  currentPath.push(root.name);
  if (root.items && root.items.length) {
    for (let item of root.items) {
      collection[item.name] = {
        name: item.name,
        page: item.href,
        categories: currentPath.slice()
      };
    }
  }
  if (root.categories && root.categories.length) {
    for (let child of root.categories)
      traverseCategoryTree(child, currentPath, collection);
  }
  currentPath.pop();
}