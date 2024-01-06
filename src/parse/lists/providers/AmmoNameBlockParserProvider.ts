import {Item, ItemCard} from '../../../common/types';
import {PlatformVarying} from '../../../platform-varying';
import {CellContext, HeaderContext} from '../cell-parsers';
import {NameBlockParserProvider} from './NameBlockParserProvider';

export class AmmoNameBlockParserProvider extends NameBlockParserProvider {

  constructor() {
    super('span[title]:first-child');
  }

  protected isNameBlock(caption: string, header: HeaderContext): boolean {
    return header.table.isLined && (caption === 'type' && this.isAmmoFile(header) || caption === 'flare');
  }

  private isAmmoFile(header: HeaderContext): boolean {
    let fileName = header.table.file.toLowerCase();
    return fileName.indexOf('rockets') !== -1 || fileName.indexOf('bombs') !== -1;
  }
// @ts-ignore
  protected parseNameCell(td: HTMLTableCellElement, card: PlatformVarying<ItemCard>, item: Item, context: CellContext) {
    let dummy = {
      meta: {},
      card: {} as PlatformVarying<ItemCard>
    } as Item;
    super.parseNameCell(td, dummy.card, dummy, context);
    item.name = dummy.name;
    item.meta.platforms = dummy.meta.platforms;
    card.id = dummy.card.id;
  }
}