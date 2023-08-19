import {EntryInfo} from '../../fetch/fetch-lists';
import {getType} from '../../packed-varying';
import {ALL_PLATFORMS, PlatformList, PlatformName, PlatformVaryingValue, pullToTop} from '../../platform-varying';
import {ItemDescriptor, ParsedItem} from './cell-parsers';
import {ContentHandler, ListProcessor} from './list-processor';
import {ItemListDocumentParser} from './parse-list-file';
import {ItemTableParser, NOOP_PARSER_PROVIDER} from './parse-table';
import {BehaviorPropertiesProvider} from './providers/BehaviorPropertiesProvider';
import {BlastRadiusProvider} from './providers/BlastRadiusProvider';
import {CommonParserProvider} from './providers/CommonParserProvider';
import {CompositeParserProvider} from './providers/CompositeParserProvider';
import {NameBlockParserProvider} from './providers/NameBlockParserProvider';
import {WhipEffectParserProvider} from './providers/WhipEffectParserProvider';

export type NormalizedItem = PlatformVaryingValue<ItemDescriptor>;

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

class ParsedListsCollector implements ContentHandler {
  intermediateData: { [file: string]: { [section: string]: NormalizedItem[] } } = {};
  finalData: { [name: string]: NormalizedItem } = {};

  handle(parsedContent: { [section: string]: ParsedItem[] }, fileKey: string): void {
    this.intermediateData[fileKey] = this.normalizeContent(parsedContent);
  }

  finalizeParsing(): void {
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
  }

  sortKeys() {
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

  private normalizeContent(parsedContent: { [section: string]: ParsedItem[] }): { [section: string]: NormalizedItem[] } {
    let result: { [section: string]: NormalizedItem[] } = {};
    for (let section in parsedContent) {
      result[section] = parsedContent[section]
          .map(item => this.normalizeItem(item))
    }
    return result;
  }

  private normalizeItem(item: ParsedItem): NormalizedItem {
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

export async function parseAll(entry: EntryInfo): Promise<{ [name: string]: NormalizedItem }> {
  const collector = new ParsedListsCollector();
  const parseProvider = new CompositeParserProvider(
      new CommonParserProvider(),
      new NameBlockParserProvider(),
      new WhipEffectParserProvider(),
      new BlastRadiusProvider(),
      new BehaviorPropertiesProvider(),
      NOOP_PARSER_PROVIDER);
  const tableParser = new ItemTableParser(parseProvider);
  const fileParser = new ItemListDocumentParser(tableParser);
  const processor = new ListProcessor(fileParser, collector);
  await processor.processLists(entry);
  return collector.finalData;
}