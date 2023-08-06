import {PlatformVarying} from '../platform-varying';

export type BaseItemDescriptor = {
  id?: number;
  name?: string;
};
export type ItemDescriptor = BaseItemDescriptor & { [key: string]: any };

export type ParsingException = {
  col: number;
  property?: string;
  message?: string;
  value?: any;
}
export type ParsingExceptions = {
  exceptions?: ParsingException[];
}

export type TableContext = {
  file: string;
  section: string;
  table: HTMLTableElement;
  columnCount: number;
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
}

export type ParsedItem = PlatformVarying<ItemDescriptor> & ParsingExceptions;

export type CellParser = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext) => void;
