import {ItemCard} from '../common/types';
import {ParsedSection} from '../parse/common';
import {PlatformName, PlatformVarying, PlatformVaryingValue} from '../platform-varying';

export interface ShortItemInfo {
  id?: number;
  name: string;
  page: string;
}

export interface NameCollectionException {
  message: string;
}

export interface ExtractionResult {
  item: Partial<ShortItemInfo>;
  exceptions: NameCollectionException[];
  missing: { [key: string]: true };
}

export interface ShortInfoCollection {
  items: { [key: string]: ShortItemInfo };
  fails: ExtractionResult[];
}

export class ShortInfoCollector implements ShortInfoCollection {
  items: { [key: string]: ShortItemInfo } = {};
  fails: ExtractionResult[] = [];

  collect(fileContent: ParsedSection[]): void {
    fileContent
        .flatMap(section => section.items)
        .forEach(item => this.collectItem(item));
  }

  collectItem(item: PlatformVarying<ItemCard>) {
    const exceptions: NameCollectionException[] = [];
    const key = this.extractKey(item, exceptions);
    if (!key) {
      this.fails.push({
        item: (item as any),
        exceptions,
        missing: {'name': true}
      });
    } else {
      this.collectInternal(this.extractProperties(item));
    }
  }

  collectDirectly(extracted: Partial<ShortItemInfo>) {
    this.collectInternal({
      item: extracted,
      exceptions: [],
      missing: {}
    });
  }

  private collectInternal(report: ExtractionResult) {
    const {item: extracted, exceptions, missing} = report;
    const key = extracted.name!.toLowerCase();
    if (exceptions.length) {
      this.fails.push(report);
    } else {
      if (key in this.items) {
        const collected = this.items[key];
        let matches = ['id', 'name', 'page']
            .map(property => this.checkMatch(collected, report, property as keyof ShortItemInfo))
            .every(x => x);
        if (!matches)
          this.fails.push(report);
        else {
          if (Object.keys(missing).length)
            this.fails.push(report);
          Object.assign(collected, extracted);
        }
      } else {
        if (Object.keys(missing).length)
          this.fails.push(report);
        this.items[key] = extracted as ShortItemInfo;
      }
    }
  }

  private checkMatch(collected: Partial<ShortItemInfo>, report: ExtractionResult, property: keyof ShortItemInfo): boolean {
    if (!(property in collected) || !(property in report.item)) return true;
    if (collected[property] === report.item[property]) return true;
    report.exceptions.push({
      message: `${property}: conflicting values with other source`
    });
    return false;
  }

  private extractProperties(item: PlatformVarying<ItemCard>): ExtractionResult {
    const result: ExtractionResult = {
      item: {},
      exceptions: [],
      missing: {}
    };

    const getProperty = (property: keyof ShortItemInfo, reportMissing = true) => {
      let value: any = this.extractVaryingProperty(item, property, result.exceptions);
      if (value === undefined) {
        if (reportMissing)
          result.missing[property] = true;
      } else
        result.item[property] = value;
    };

    getProperty('id', false);
    getProperty('name');
    getProperty('page');

    return result;

  }

  private extractKey(item: PlatformVarying<ItemCard>, exceptions: NameCollectionException[]): string | undefined {
    return this.extractVaryingProperty(item, 'name', exceptions, s => s.toLowerCase());
  }

  private extractVaryingProperty<K extends keyof ItemCard, T = ItemCard[K]>(item: PlatformVarying<ItemCard>, property: K, exceptions: NameCollectionException[], transform: (x: T) => T = x => x): T | undefined {
    let varyingValue = item[property] as PlatformVaryingValue<T>;
    if (varyingValue) {
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