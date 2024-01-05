import * as fs from 'fs';
import {JSDOM} from 'jsdom';
import {ScrappedItemWithSource} from '../common/types';

export type ParsedSection = {
  title: string,
  index: number,
  items: ScrappedItemWithSource[];
  exceptions?: any[];
}

export async function loadDocument(file: string): Promise<Document> {
  const content = await fs.promises.readFile(file, {encoding: 'utf8'});
  return new JSDOM(content).window.document;
}