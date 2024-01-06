import {Item, ListSource} from '../common/types';
import {sortKeys} from '../common/utils';

export interface ListIndexRecord {
  name: string;
  sources: ListSource[];
  exceptions?: any;
}

export class ListIndexBuilder {
  data: { [name: string]: ListIndexRecord } = {};

  collect(item: Item) {
    const name = item.name;
    if (!(name in this.data)) {
      this.data[name] = {
        name,
        sources: item.meta.sources as ListSource[]
      };
    } else {
      const record = this.data[name];
      record.sources.push(...(item.meta.sources as ListSource[]));
    }
  }

  finish() {
    this.data = sortKeys(this.data);
  }
}
