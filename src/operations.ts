import {EntryInfo} from './execution';
import {fetchCategories} from './fetch/fetch-categories';
import {fetchLists} from './fetch/fetch-lists';
import {parseCategories} from './parse/parse-categories';

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

export type OperationSet = {
  [key in OperationNames]: boolean
}

export type Operation = (entry: EntryInfo) => Promise<void>;

export const OPERATIONS: { [key in OperationNames]?: Operation } = {
  fetchCategories,
  fetchLists,
  parseCategories
}

