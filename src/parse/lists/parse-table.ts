import {CellParser, HeaderContext, NOOP_PARSER, ParsedItem, ParsingException, TableContext} from './cell-parsers';

export interface ParserProvider {
  getParser(header: HeaderContext): CellParser | undefined;
}

type CellCoordinates = {
  td: HTMLTableCellElement;
  x: number;
  y: number;
  colSpan: number;
  rowSpan: number;
  shiftX: number;
  shiftY: number;
  rowIdx: number;
  cellIdx: number;
}

type ParserBinding = {
  header: HeaderContext;
  parser: CellParser;
}

export class ItemTableParser {
  constructor(private parserProvider: ParserProvider) {
  }

  parse(context: TableContext): ParsedItem[] {
    const [headerRows, bodyRows] = this.separateHeaderRows(context.table);
    const rowNum = bodyRows.length;
    const colNum = context.columnCount = bodyRows[0].cells.length;
    const parsers = this.getParsers(context, this.getHeaderCells(headerRows, colNum));
    const result: ParsedItem[] = Array(rowNum);
    for (let row = 0; row < rowNum; ++row) {
      const itemRow = bodyRows[row];
      const item: ParsedItem = result[row] = {};
      for (let column = 0; column < colNum; ++column) {
        const td = itemRow.cells[column];
        const cellContext = {
          table: context,
          header: parsers[column].header,
          td, column: row, row: row
        };
        try {
          parsers[column].parser(td, item, cellContext);
        } catch (ex) {
          let exInfo: ParsingException = {col: column};
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

  private separateHeaderRows(table: HTMLTableElement): [ArrayLike<HTMLTableRowElement>, ArrayLike<HTMLTableRowElement>] {
    if (table.tHead) return [table.tHead!.rows, table.tBodies[0].rows];
    let allRows = table.tBodies[0].rows;
    let headerRows: HTMLTableRowElement[] = [];
    for (let row of allRows) {
      let headerCellCount = row.querySelectorAll('th').length;
      if (headerCellCount > 0 && row.cells.length - headerCellCount <= 1)
        headerRows.push(row);
      else
        break;
    }
    return [headerRows, [...allRows].slice(headerRows.length)];
  }

  private getHeaderCells(headerRows: ArrayLike<HTMLTableRowElement>, width: number): CellCoordinates[][] {
    const height = headerRows.length;
    const matrix: CellCoordinates[][] = Array.from(headerRows, _ => Array(width));
    for (let y = 0, rowIdx = 0; y < height; ++y, ++rowIdx) {
      let cells = headerRows[rowIdx].cells;
      for (let x = 0, cellIdx = 0; x < width; ++x) {
        if (matrix[y][x]) continue;
        const td = cells[cellIdx];
        const colSpan = td.colSpan || 1;
        const rowSpan = td.rowSpan || 1;
        for (let shiftY = 0; shiftY < rowSpan; ++shiftY) {
          for (let shiftX = 0; shiftX < colSpan; ++shiftX) {
            matrix[y + shiftY][x + shiftX] = {
              td, shiftX, shiftY, rowIdx, cellIdx, colSpan, rowSpan,
              x: x + shiftX,
              y: y + shiftY
            };
          }
        }
        cellIdx++;
      }
    }
    return matrix;
  }

  private getParsers(context: TableContext, headerCells: CellCoordinates[][]): ParserBinding[] {
    const width = context.columnCount;
    const height = headerCells.length;
    const result: ParserBinding[] = Array(width);
    for (let column = 0; column < width; ++column) {
      for (let row = height - 1; row >= 0; --row) {
        // bottommost header is considered the most specific
        const cellInfo = headerCells[row][column];
        const header: HeaderContext = {
          table: context,
          th: cellInfo.td,
          column,
          colSpan: cellInfo.colSpan,
          rowSpan: cellInfo.rowSpan,
          shift: cellInfo.shiftX,
          colIdx: cellInfo.cellIdx,
          rowIdx: cellInfo.rowIdx
        }
        const parser = this.parserProvider.getParser(header);
        if (parser) {
          result[column] = {header, parser};
          break;
        }
      }
    }
    return result;
  }
}

export const NOOP_PARSER_PROVIDER: ParserProvider = {
  getParser(header: HeaderContext): CellParser | undefined {
    return NOOP_PARSER;
  }
}