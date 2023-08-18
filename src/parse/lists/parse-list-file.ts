import {ALL_PLATFORMS, PlatformList} from '../../platform-varying';
import {extractPlatformsFromImages} from '../extract-varying';
import {ParsedItem, TableContext} from './cell-parsers';
import {ItemTableParser} from './parse-table';

export class ItemListDocumentParser {
  constructor(private tableParser: ItemTableParser) {
  }

  parseTablesPerSection(root: Document, fileKey: string): { [section: string]: ParsedItem[] } {
    let tables = root.querySelectorAll<HTMLTableElement>('table.terraria.sortable');
    let result: { [section: string]: ParsedItem[] } = {};
    let platforms = this.getPlatforms(root);
    for (let table of tables) {
      let sectionHeader = this.getClosestSectionHeader(table);
      let sectionName = sectionHeader ? sectionHeader.textContent!.trim().toLowerCase() : '';
      let tableContext: TableContext = {
        file: fileKey,
        section: sectionName,
        columnCount: -1,
        table,
        platforms
      }
      result[sectionName] = this.tableParser.parse(tableContext);
    }
    return result;
  }

  private getPlatforms(root: Document): PlatformList {
    const contentRoot = root.querySelector('.mw-parser-output')!;
    let messageBox = contentRoot.querySelector('.message-box.msgbox-color-blue');
    return messageBox ? extractPlatformsFromImages(messageBox) : ALL_PLATFORMS.slice();
  }

  private getClosestSectionHeader(table: Element): Element | null {
    let element: Element | null = table;
    while (element && !element.matches('h1, h2, h3, h4'))
      element = element.previousElementSibling;
    return element;
  }
}

