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
export type ParsedItem = PlatformVarying<ItemDescriptor> & ParsingExceptions;
export type CellParser = (td: HTMLTableCellElement, item: ParsedItem, row: number, th: HTMLTableCellElement, shift: number, col: number) => void;

declare function getParser(th: HTMLTableCellElement, shift: number, col: number): CellParser;

export function parseTable(table: HTMLTableElement): ParsedItem[] {
  let hasTHead = !!table.tHead;
  const headerRow = hasTHead ? table.tHead!.rows[0] : table.tBodies[0].rows[0];
  const rows = hasTHead ? Array.from(table.tBodies[0].rows) : Array.from(table.tBodies[0].rows).slice(1);
  const rowNum = rows.length;
  if (rowNum === 0) return [];

  const colNum = rows[0].cells.length;
  const headerCells: HTMLTableCellElement[] = Array(colNum);
  const shifts: number[] = Array(colNum);
  const parsers: CellParser[] = Array(colNum);
  for (let col = 0, i = 0; col < colNum; ++col) {
    let colSpan = headerRow.cells[i].colSpan || 1;
    for (let shift = 0; shift < colSpan; ++shift, ++col)
      parsers[col] = getParser(headerCells[col] = headerRow.cells[i], shifts[col] = shift, col);
  }
  const result: ParsedItem[] = Array(rowNum);
  for (let row = 0; row < rowNum; ++row) {
    const itemRow = rows[row];
    const item: ParsedItem = result[row] = {};
    for (let col = 0; col < colNum; ++col) {
      try {
        parsers[col](itemRow.cells[col], item, row, headerCells[col], shifts[col], col);
      } catch (ex) {
        let exInfo: ParsingException = {col};
        if (ex instanceof Error)
          exInfo.message = ex.message;
        else exInfo.value = String(ex);
        if (!item.exceptions)
          item.exceptions = [];
        item.exceptions.push(exInfo);
      }
    }
  }
  return result;
}