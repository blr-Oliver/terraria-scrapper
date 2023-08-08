import {EntryInfo} from '../../fetch/fetch-lists';
import {ParsedItem} from './cell-parsers';
import {CommonParserProvider} from './CommonParserProvider';
import {CompositeParserProvider} from './CompositeParserProvider';
import {ContentHandler, ListProcessor} from './list-processor';
import {NameBlockParserProvider} from './NameBlockParserProvider';
import {ItemListDocumentParser} from './parse-list-file';
import {ItemTableParser, NOOP_PARSER_PROVIDER} from './parse-table';
import {WhipEffectParserProvider} from './WhipEffectParserProvider';

class ParsedListsCollector implements ContentHandler {
  data: { [file: string]: { [p: string]: ParsedItem[] }[] } = {};

  handle(parsedContent: { [p: string]: ParsedItem[] }, fileKey: string): void {
    if (!this.data[fileKey])
      this.data[fileKey] = [];
    this.data[fileKey].push(parsedContent);
  }

  finalizeParsing(): void {
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
  return collector.data;
}