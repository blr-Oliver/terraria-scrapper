import {ALL_PLATFORMS, PlatformList} from '../../platform-varying';
import {ParsedSection, ParsingException} from '../common';
import {extractPlatformsFromImages} from '../extract-varying';
import {TableContext} from './cell-parsers';
import {ItemTableParser} from './ItemTableParser';

const SELECTORS = {
  TABLE: 'table.terraria.sortable',
  CONTENT_ROOT: '.mw-parser-output',
  PLATFORM_BOX: '.message-box.msgbox-color-blue',
  HEADERS: 'h1, h2, h3, h4'
}

export class ItemListDocumentParser {
  constructor(private tableParser: ItemTableParser) {
  }

  parseLists(root: Document, /* deprecated */fileKey: string): ParsedSection[] {
    let tables = root.querySelectorAll<HTMLTableElement>(SELECTORS.TABLE);
    let platforms = this.getPlatforms(root);
    let result: ParsedSection[] = [];
    for (let i = 0; i < tables.length; ++i) {
      result.push(this.parseTable(tables[i], i, platforms, fileKey));
    }
    return result;
  }

  private parseTable(table: HTMLTableElement, index: number, platforms: PlatformList, fileKey: string): ParsedSection {
    let exceptions: ParsingException[] = [];
    let sectionHeader = this.getClosestSectionHeader(table);
    if (!sectionHeader) {
      exceptions.push({message: 'missing title'});
    }
    let sectionName = sectionHeader ? sectionHeader.textContent!.trim().toLowerCase() : '';
    let tableContext: TableContext = {
      file: fileKey,
      section: sectionName,
      sectionIndex: index,
      columnCount: -1,
      table,
      platforms
    }
    let result: ParsedSection = {
      title: sectionName,
      index,
      items: this.tableParser.parse(tableContext)
    };
    if (exceptions.length)
      result.exceptions = exceptions;
    return result;
  }

  private getPlatforms(root: Document): PlatformList {
    let contentRoot = root.querySelector(SELECTORS.CONTENT_ROOT)!;
    let messageBox = contentRoot.querySelector(SELECTORS.PLATFORM_BOX);
    return messageBox ? extractPlatformsFromImages(messageBox) : ALL_PLATFORMS.slice();
  }

  private getClosestSectionHeader(table: Element): Element | null {
    let element: Element | null = table;
    while (element && !element.matches(SELECTORS.HEADERS))
      element = element.previousElementSibling;
    return element;
  }
}

