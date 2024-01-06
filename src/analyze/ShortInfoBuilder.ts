import {Item} from '../common/types';
import {sortKeys} from '../common/utils';
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

  collectListInfo(item: Item) {
    const name = item.name;
    const record = (name in this.data) ? this.data[name] : (this.data[name] = {name});
    this.resolvePage(record, item.meta.page);
  }

  private resolvePage(record: ItemShortInfo, page?: string) {
    if (record.page) {
      if (page && page !== record.page)
        this.addException(record, 'conflicting page', page);
    } else {
      if (page) record.page = page;
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