import {ParsedSection} from '../common';

export interface ItemListCollector<T> {
  collect(fileContent: ParsedSection[], fileKey: string): void;
  finish(): T;
}