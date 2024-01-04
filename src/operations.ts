import * as fs from 'fs';
import {buildListIndex} from './analyze/build-list-index';
import {buildCardIndex} from './analyze/collect-cards';
import {collectShortInfo} from './analyze/collect-short-info';
import {combineSources} from './analyze/combine-sources';
import {flattenCategories} from './analyze/flatten-categories';
import {packCards} from './analyze/pack-cards';
import {EntryInfo} from './execution';
import {ensureExists} from './fetch/common';
import {fetchCards} from './fetch/fetch-cards';
import {fetchCategories} from './fetch/fetch-categories';
import {fetchLists} from './fetch/fetch-lists';
import {loadDocument} from './parse/common';
import {parseLists} from './parse/lists/parse-lists';
import {parseCards} from './parse/parse-cards';
import {parseCategoriesFromDom} from './parse/parse-categories';

export type OperationNames =
    'fetchCategories' |
    'fetchLists' |
    'parseCategories' |
    'flattenCategories' |
    'parseLists' |
    'buildListIndex' |
    'collectShortInfo' |
    'fetchCards' |
    'parseCards' |
    'buildCardIndex' |
    'combineSources' |
    'packCards'
    ;

export const OPERATION_ORDER: OperationNames[] = [
  'fetchCategories',
  'fetchLists',
  'parseCategories',
  'flattenCategories',
  'parseLists',
  'buildListIndex',
  'collectShortInfo',
  'fetchCards',
  'parseCards',
  'buildCardIndex',
  'combineSources',
  'packCards'
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
  flattenCategories,
  parseLists,
  buildListIndex,
  collectShortInfo,
  fetchCards,
  parseCards,
  buildCardIndex,
  combineSources,
  packCards
}
