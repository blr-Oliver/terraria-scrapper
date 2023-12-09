import * as fs from 'fs';
import {EntryInfo} from './execution';
import {ensureExists} from './fetch/common';
import {fetchCategories} from './fetch/fetch-categories';
import {fetchLists} from './fetch/fetch-lists';
import {loadDocument} from './parse/common';
import {parseLists} from './parse/lists/parse-lists';
import {parseCategoriesFromDom} from './parse/parse-categories';

export type OperationNames =
    'fetchCategories' |
    'fetchLists' |
    'parseCategories' |
    'parseLists' |
    'collectNames' |
    'fetchCards' |
    'parseCards' |
    'combineItemData' |
    'splitPlatforms' |
    'packPlatforms';

export const OPERATION_ORDER: OperationNames[] = [
  'fetchCategories',
  'fetchLists',
  'parseCategories',
  'parseLists',
  'collectNames',
  'fetchCards',
  'parseCards',
  'combineItemData',
  'splitPlatforms',
  'packPlatforms'
]

export type Operation = (entry: EntryInfo) => Promise<void>;

export async function parseCategories(entry: EntryInfo): Promise<void> {
  let category = parseCategoriesFromDom(await loadDocument(`${entry.out}/html/${entry.categories}.html`));
  await ensureExists(`${entry.out}/json`);
  return fs.promises.writeFile(`${entry.out}/json/categories.json`, JSON.stringify(category, null, 2), {encoding: 'utf8'});
}

export const OPERATIONS: { [key in OperationNames]?: Operation } = {
  fetchCategories,
  fetchLists,
  parseCategories,
  parseLists
}
