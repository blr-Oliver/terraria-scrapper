import {ListSource, ScrappedItemWithSource} from '../common/types';
import {sortKeys} from '../common/utils';
import {PlatformList} from '../platform-varying';

export interface ListIndexRecord {
  name: string;
  platforms: PlatformList;
  sources: ListSourceWithPlatforms[];
  exceptions?: any;
}

export interface ListSourceWithPlatforms extends ListSource {
  platforms: PlatformList;
}

export class ListIndexBuilder {
  data: { [name: string]: ListIndexRecord } = {};

  collect(item: ScrappedItemWithSource) {
    const name = item.name;
    const newPlatforms = item.platforms.sort();
    if (!(name in this.data)) {
      this.data[name] = {
        name,
        platforms: newPlatforms,
        sources: (item.sources as ListSource[]).map(x => ({...x, platforms: newPlatforms}))
      };
    } else {
      const record = this.data[name];
      const oldPlatforms = record.platforms;
      if (!isSameSortedArray(oldPlatforms, newPlatforms)) {
        if (!record.exceptions) record.exceptions = {};
        record.exceptions!['conflicting platforms'] = true;
        let allPlatforms: { [platform: string]: true } = {};
        for (let oldPlatform of oldPlatforms) {
          allPlatforms[oldPlatform] = true;
        }
        for (let newPlatform of newPlatforms) {
          allPlatforms[newPlatform] = true;
        }
        record.platforms = Object.keys(allPlatforms).sort() as PlatformList;
      }
      record.sources.push(...(item.sources as ListSource[]).map(x => ({...x, platforms: newPlatforms})));
    }
  }

  finish() {
    this.data = sortKeys(this.data);
  }
}

export function isSameSortedArray(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; ++i)
    if (a[i] !== b[i]) return false;
  return true;
}