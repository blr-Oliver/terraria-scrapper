import {getType} from '../../../packed-varying';
import {ALL_PLATFORMS, PlatformList, PlatformName, pullToTop} from '../../../platform-varying';
import {NormalizedItem, ParsedListItem, ParsedSection} from '../../common';
import {ItemListCollector} from '../ItemListCollector';

function combine(a: any, b: any, key?: string): any {
  if (a == null) return b;
  if (b == null) return a;
  const aType = getType(a);
  if (aType !== getType(b)) throw new Error('Incompatible types');
  if (aType === 'primitive') {
    if (typeof a === 'string') {
      return a ? a : b;
    } else
      return a;
  }
  if (aType === 'object') {
    const result: any = {};
    for (let aKey in a) {
      let value = combine(a[aKey], b[aKey], aKey);
      if (value != null)
        result[aKey] = value;
    }
    for (let bKey in b) {
      if (!(bKey in result)) {
        let value = b[bKey];
        if (value != null)
          result[bKey] = value;
      }
    }
    return result;
  }
  if (aType === 'array') {
    if (key === 'source') {
      return a.concat(b);
    }
    const l = Math.max(a.length, b.length);
    const result = Array(l);
    for (let i = 0; i < l; ++i)
      result[i] = combine(a[i], b[i]);
    return result;
  }
}

export class CombiningItemDataCollector implements ItemListCollector<{ [name: string]: NormalizedItem }> {
  private intermediateData: { [file: string]: { [section: string]: NormalizedItem[] } } = {};
  private finalData: { [name: string]: NormalizedItem } = {};

  collect(fileContent: ParsedSection[], fileKey: string): void {
    this.intermediateData[fileKey] = this.normalizeContent(fileContent);
  }

  finish(): { [name: string]: NormalizedItem } {
    for (let file in this.intermediateData) {
      let fileContent = this.intermediateData[file];
      for (let section in fileContent) {
        let sectionList = fileContent[section];
        for (let item of sectionList) {
          let name = this.getName(item);
          if (name in this.finalData) {
            this.finalData[name] = combine(this.finalData[name]!, item);
          } else {
            this.finalData[name] = item;
          }
        }
      }
    }
    this.sortKeys();
    return this.finalData;
  }

  private sortKeys() {
    let sorted = Object.keys(this.finalData).sort();
    let sortedData: { [name: string]: NormalizedItem } = {};
    for (let key of sorted)
      sortedData[key] = this.finalData[key];
    this.finalData = sortedData;
  }

  private getName(item: NormalizedItem): string {
    for (let key in item) {
      let name = item[key as PlatformName]!.name;
      if (name) return name;
    }
    throw new Error('unnamed item');
  }

  private normalizeContent(parsedContent: ParsedSection[]): { [section: string]: NormalizedItem[] } {
    let result: { [section: string]: NormalizedItem[] } = {};
    for (let section of parsedContent) {
      result[section.title] = section.items
          .map(item => this.normalizeItem(item))
    }
    return result;
  }

  private normalizeItem(item: ParsedListItem): NormalizedItem {
    let platforms: PlatformList;
    if (item.name)
      platforms = Object.keys(item.name) as PlatformList;
    else if (item.id)
      platforms = Object.keys(item.id) as PlatformList;
    else
      platforms = ALL_PLATFORMS as PlatformList;
    let exceptions = item.exceptions;
    delete item.exceptions;
    let result: NormalizedItem = pullToTop(item, platforms);
    if (exceptions) {
      //TODO
    }
    return result;
  }
}