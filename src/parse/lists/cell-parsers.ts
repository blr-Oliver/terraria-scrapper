import {ItemCard} from '../../common/types';
import {PlatformList, PlatformVarying} from '../../platform-varying';

export type TableContext = {
  file: string;
  section: string;
  sectionIndex: number;
  table: HTMLTableElement;
  isLined: boolean;
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
  exceptions?: any[];
}

export interface ICellParser {
  parse: (td: HTMLTableCellElement, item: PlatformVarying<ItemCard>, context: CellContext) => void;
  getPlatforms?: (td: HTMLTableCellElement, item: PlatformVarying<ItemCard>, context: CellContext) => PlatformList;
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