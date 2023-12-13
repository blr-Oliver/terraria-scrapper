import {PlatformList} from '../../platform-varying';
import {ParsedListItem} from '../common';

export interface Item {
  id?: number;
  name?: string;
}

export interface MultiSourceItem extends Item {
  sources: ItemSourceInfo[];
}

export type ItemSourceInfo = {
  file: string;
  section: string;
}

export type TableContext = {
  file: string;
  section: string;
  sectionIndex: number;
  table: HTMLTableElement;
  columnCount: number;
  platforms: PlatformList;
}

export type HeaderContext = {
  table: TableContext;
  th: HTMLTableCellElement;
  column: number;
  colSpan: number;
  rowSpan: number;
  shift: number;
  colIdx: number;
  rowIdx: number;
}

export type CellContext = {
  table: TableContext;
  header: HeaderContext;
  td: HTMLTableCellElement;
  column: number;
  row: number;
  platforms: PlatformList;
}

export interface ICellParser {
  parse: (td: HTMLTableCellElement, item: ParsedListItem, context: CellContext) => void;
  getPlatforms?: (td: HTMLTableCellElement, item: ParsedListItem, context: CellContext) => PlatformList;
}

export interface ICellPropertyParser extends ICellParser {
  property: string
}

export const NOOP_PARSER: ICellParser = {
  parse: () => void 0
};

export interface ParserProvider {
  getParser(header: HeaderContext): ICellParser | undefined;
}

export const NOOP_PARSER_PROVIDER: ParserProvider = {
  getParser() {
    return NOOP_PARSER;
  }
}