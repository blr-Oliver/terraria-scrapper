import {PlatformList} from '../../platform-varying';
import {ParsedItem} from '../common';

export type BaseItemDescriptor = {
  id?: number;
  name?: string;
  sources: ItemSourceInfo[];
};
export type ItemSourceInfo = {
  file: string;
  section: string;
}

export type ParsingException = {
  col: number;
  property?: string;
  message?: string;
  value?: any;
}

export type TableContext = {
  file: string;
  section: string;
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
  parse: (td: HTMLTableCellElement, item: ParsedItem, context: CellContext) => void;
  getPlatforms?: (td: HTMLTableCellElement, item: ParsedItem, context: CellContext) => PlatformList;
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