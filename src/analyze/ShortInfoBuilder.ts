import {ItemCard, ScrappedItem} from '../common/types';
import {sortKeys} from '../common/utils';
import {PlatformVarying, PlatformVaryingValue} from '../platform-varying';
import {ItemCategoryInfo} from './flatten-categories';

export interface ItemShortInfo {
  name: string;
  page?: string;
  exceptions?: any;
}

export class ShortInfoBuilder {
  data: { [name: string]: ItemShortInfo } = {};

  collectCategoryInfo(item: ItemCategoryInfo) {
    const {name, page} = item;
    const record = (name in this.data) ? this.data[name] : (this.data[name] = {name});
    this.resolvePage(record, page);
  }

  collectListInfo(item: ScrappedItem) {
    const name = item.name;
    const record = (name in this.data) ? this.data[name] : (this.data[name] = {name});
    this.resolvePage(record, this.extractPage(item, record));
  }

  private resolvePage(record: ItemShortInfo, page?: string) {
    if (record.page) {
      if (page && page !== record.page)
        this.addException(record, 'conflicting page', page);
    } else {
      if (page) record.page = page;
    }
  }

  private extractPage(item: ScrappedItem, record: ItemShortInfo): string | undefined {
    const card: PlatformVarying<ItemCard> = item.item;
    const pageValue: PlatformVaryingValue<string> = card.page;
    if (pageValue) {
      let result: string | undefined = undefined;
      for (let platform of item.platforms) {
        let value = pageValue[platform];
        if (value) {
          if (typeof result === 'undefined') {
            result = value;
          } else {
            if (result !== value) {
              this.addException(record, 'ambiguous page', value);
            }
          }
        }
      }
      return result;
    }
  }

  private addException(record: ItemShortInfo, key: string, value: string) {
    if (!record.exceptions) record.exceptions = {};
    if (!record.exceptions[key]) record.exceptions[key] = [];
    (record.exceptions[key] as string[]).push(value);
  }

  finish() {
    this.data = sortKeys(this.data);
  }
}