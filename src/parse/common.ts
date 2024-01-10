import * as fs from 'fs';
import {JSDOM} from 'jsdom';
import {Item} from '../common/types';

export type ParsedSection = {
  title: string,
  index: number,
  items: Item[];
  exceptions?: any[];
}

export async function loadDocument(file: string): Promise<Document> {
  const content = await fs.promises.readFile(file, {encoding: 'utf8'});
  return new JSDOM(content).window.document;
}

export function getClosestSectionHeader(table: Element): Element | null {
  let element: Element | null = table;
  while (element && !element.matches('h1, h2, h3, h4'))
    element = element.previousElementSibling;
  return element;
}