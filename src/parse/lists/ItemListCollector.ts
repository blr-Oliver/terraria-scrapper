import {ItemListPerSection} from '../common';

export interface ItemListCollector {
  collect(fileContent: ItemListPerSection, fileKey: string): void;
  finish(): void;
}