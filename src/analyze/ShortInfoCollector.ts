import {ParsedListItem, ParsedSection} from '../parse/common';
import {PlatformName} from '../platform-varying';

export interface ShortItemInfo {
  id?: number;
  name: string;
  page: string;
}

export interface NameCollectionException {
  message: string;
}

export interface FailedItem {
  item: Partial<ShortItemInfo>,
  exceptions: NameCollectionException[]
}

export interface ShortInfoCollection {
  items: { [key: string]: ShortItemInfo };
  fails: FailedItem[];
}

export class ShortInfoCollector implements ShortInfoCollection {
  items: { [key: string]: ShortItemInfo } = {};
  fails: FailedItem[] = [];

  collect(fileContent: ParsedSection[]): void {
    fileContent
        .flatMap(section => section.items)
        .forEach(item => this.collectItem(item));
  }

  collectItem(item: ParsedListItem): ShortItemInfo | undefined {
    const exceptions: NameCollectionException[] = [];
    const key = this.extractKey(item, exceptions);
    if (!key) {
      this.fails.push({
        item: (item as any),
        exceptions
      });
    } else {
      return this.collectDirectly(this.extractProperties(item, exceptions), exceptions);
    }
  }

  collectDirectly(extracted: Partial<ShortItemInfo>, exceptions: NameCollectionException[] = []): ShortItemInfo | undefined {
    const key = extracted.name!.toLowerCase();
    if (exceptions.length) {
      this.fails.push({
        item: extracted,
        exceptions
      })
    } else {
      if (key in this.items) {
        const collected = this.items[key];
        let matches = extracted.name === collected.name && extracted.page === collected.page;
        if (('id' in extracted) && ('id' in collected))
          matches &&= extracted.id === collected.id;
        if (!matches) {
          exceptions.push({
            message: 'conflicting values with other source'
          });
          this.fails.push({
            item: extracted,
            exceptions
          });
        } else return Object.assign(collected, extracted);
      } else {
        return this.items[key] = extracted as ShortItemInfo;
      }
    }
  }

  private extractProperties(item: ParsedListItem, exceptions: NameCollectionException[]): Partial<ShortItemInfo> {
    let id: number | undefined = 'id' in item ? this.extractVaryingProperty(item, 'id', exceptions) : undefined;
    let result: Partial<ShortItemInfo> = {
      name: this.extractVaryingProperty(item, 'name', exceptions),
      page: this.extractVaryingProperty(item, 'page', exceptions)
    };
    if (id !== undefined)
      result.id = id;
    return result;
  }

  private extractKey(item: ParsedListItem, exceptions: NameCollectionException[]): string | undefined {
    return this.extractVaryingProperty(item, 'name', exceptions, s => s.toLowerCase());
  }

  private extractVaryingProperty<T>(item: ParsedListItem, property: string, exceptions: NameCollectionException[], transform: (x: T) => T = x => x): T | undefined {
    let varyingValue = item[property];
    if (!varyingValue) {
      exceptions.push({
        message: `missing ${property}`
      });
    } else {
      let value: T;
      let hasValue = false;
      for (let key in varyingValue) {
        const platform = key as PlatformName;
        if (!hasValue) {
          value = transform(varyingValue[platform]!);
          hasValue = true;
        } else {
          let otherValue = transform(varyingValue[platform]!);
          if (value! !== otherValue) {
            exceptions.push({message: `ambiguous ${property}`});
            return undefined;
          }
        }
      }
      return value!;
    }
  }
}