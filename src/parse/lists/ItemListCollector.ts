import {ItemListPerSection} from '../common';

export interface ItemListCollector<T> {
  collect(fileContent: ItemListPerSection, fileKey: string): void;
  finish(): T;
}