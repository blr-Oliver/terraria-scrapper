import {ParsedListItem} from '../../common';
import {CellContext, HeaderContext} from '../cell-parsers';
import {NameBlockParserProvider} from './NameBlockParserProvider';

export class AmmoNameBlockParserProvider extends NameBlockParserProvider {

  constructor() {
    super('span[title]:first-child');
  }

  protected isNameBlock(caption: string, header: HeaderContext): boolean {
    return caption === 'type' && header.table.isLined && this.isAmmoFile(header);
  }

  private isAmmoFile(header: HeaderContext): boolean {
    let fileName = header.table.file.toLowerCase();
    return fileName.indexOf('rockets') !== -1 || fileName.indexOf('bombs') !== -1;
  }
// @ts-ignore
  protected parseNameCell(td: HTMLTableCellElement, item: ParsedListItem, context: CellContext) {
    let dummy: ParsedListItem = {};
    super.parseNameCell(td, dummy, context);
    item.name = dummy.name;
    item.id = dummy.id;
    if (dummy['page']) item['page'] = dummy['page'];
  }
}