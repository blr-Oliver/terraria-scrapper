import * as fs from 'fs';
import {JSDOM} from 'jsdom';
import {MultiSourceItem, ScrappedItemWithSource} from '../common/types';
import {PlatformVaryingValue} from '../platform-varying';

export type ItemDescriptor = MultiSourceItem & { [key: string]: any };

export interface ListRowParsingException {
  col: number;
  property?: string;
  value?: any;
  message?: string;
}

export type ParsedSection = {
  title: string,
  index: number,
  items: ScrappedItemWithSource[];
  exceptions?: any[];
}

export type NormalizedItem = PlatformVaryingValue<ItemDescriptor>;

export async function loadDocument(file: string): Promise<Document> {
  const content = await fs.promises.readFile(file, {encoding: 'utf8'});
  return new JSDOM(content).window.document;
}