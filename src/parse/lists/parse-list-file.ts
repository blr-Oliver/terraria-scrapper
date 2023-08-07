import {ParsedItem, TableContext} from './cell-parsers';
import {ItemTableParser} from './parse-table';

export class ItemListDocumentParser {
  constructor(private tableParser: ItemTableParser) {
  }

  parseTablesPerSection(root: Document, fileKey: string): { [section: string]: ParsedItem[] } {
    let tables = root.querySelectorAll<HTMLTableElement>('table.terraria.sortable');
    let result: { [section: string]: ParsedItem[] } = {};
    for (let table of tables) {
      let sectionHeader = this.getClosestSectionHeader(table);
      let sectionName = sectionHeader ? sectionHeader.textContent!.trim().toLowerCase() : '';
      let tableContext: TableContext = {
        file: fileKey,
        section: sectionName.toLowerCase(),
        columnCount: -1,
        table
      }
      result[sectionName] = this.tableParser.parse(tableContext);
    }
    return result;
  }

  private getClosestSectionHeader(table: Element): Element | null {
    let element: Element | null = table;
    while (element && !element.matches('h1, h2, h3, h4'))
      element = element.previousElementSibling;
    return element;
  }
}

