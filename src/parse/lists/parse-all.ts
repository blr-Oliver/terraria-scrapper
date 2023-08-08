import {EntryInfo} from '../../fetch/fetch-lists';
import {ALL_PLATFORMS, PlatformList, PlatformVaryingValue, pullToTop} from '../../platform-varying';
import {ItemDescriptor, ParsedItem, ParsingExceptions} from './cell-parsers';
import {CommonParserProvider} from './CommonParserProvider';
import {CompositeParserProvider} from './CompositeParserProvider';
import {ContentHandler, ListProcessor} from './list-processor';
import {NameBlockParserProvider} from './NameBlockParserProvider';
import {ItemListDocumentParser} from './parse-list-file';
import {ItemTableParser, NOOP_PARSER_PROVIDER} from './parse-table';
import {WhipEffectParserProvider} from './WhipEffectParserProvider';

type NormalizedItem = PlatformVaryingValue<ItemDescriptor> & ParsingExceptions;

class ParsedListsCollector implements ContentHandler {
  intermediateData: { [file: string]: { [section: string]: NormalizedItem[] }[] } = {};

  handle(parsedContent: { [section: string]: ParsedItem[] }, fileKey: string): void {
    if (!this.intermediateData[fileKey])
      this.intermediateData[fileKey] = [];
    this.intermediateData[fileKey].push(this.normalize(parsedContent));
  }

  finalizeParsing(): void {
  }

  private normalize(parsedContent: { [section: string]: ParsedItem[] }): { [section: string]: NormalizedItem[] } {
    let result: { [section: string]: NormalizedItem[] } = {};
    for (let section in parsedContent) {
      result[section] = parsedContent[section].map(item => this.normalizeItem(item));
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
    let result: NormalizedItem = pullToTop(item, platforms);
    if (exceptions)
      result.exceptions = exceptions;
    return result;
  }
}

export async function parseAll(entry: EntryInfo): Promise<unknown> {
  const collector = new ParsedListsCollector();
  const parseProvider = new CompositeParserProvider(
      new CommonParserProvider(),
      new NameBlockParserProvider(),
      new WhipEffectParserProvider(),
      NOOP_PARSER_PROVIDER);
  const tableParser = new ItemTableParser(parseProvider);
  const fileParser = new ItemListDocumentParser(tableParser);
  const processor = new ListProcessor(fileParser, collector);
  await processor.processLists(entry);
  return collector.intermediateData;
}