import {ItemCard} from '../../../common/types';
import {PlatformVarying} from '../../../platform-varying';
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
  protected parseNameCell(td: HTMLTableCellElement, item: PlatformVarying<ItemCard>, context: CellContext) {
    let dummy: PlatformVarying<ItemCard> = {} as PlatformVarying<ItemCard>;
    super.parseNameCell(td, dummy, context);
    item.name = dummy.name;
    item.id = dummy.id;
  }
}