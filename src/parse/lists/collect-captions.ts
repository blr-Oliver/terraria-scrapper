import {EntryInfo} from '../../fetch/fetch-lists';
import {HeaderContext, ICellParser, ParsedItem} from './cell-parsers';
import {ContentHandler, ListProcessor} from './list-processor';
import {ItemListDocumentParser} from './parse-list-file';
import {ItemTableParser, ParserProvider} from './parse-table';

export type HeaderOccurrence = {
  file: string;
  section: string;
}

type Hash<T> = {
  [key: string]: T;
}

export class CaptionCollector implements ParserProvider, ContentHandler {
  private preStats: Hash<Hash<Hash<boolean>>> = {};
  private stats?: Hash<HeaderOccurrence[]>;

  getParser(header: HeaderContext): ICellParser | undefined {
    this.collectHeaderInfo(header);
    return {
      parse: () => this.finalizeStats()
    };
  }

  collectHeaderInfo(header: HeaderContext) {
    const file = header.table.file;
    const section = header.table.section;
    const caption = header.th.textContent!.trim().toLowerCase();

    let fileContainer = this.preStats[file] || (this.preStats[file] = {});
    let sectionContainer = fileContainer[section] || (fileContainer[section] = {});
    sectionContainer[caption] = true;
  }

  finalizeStats() {
    //do nothing
  }

  getStats(): Hash<HeaderOccurrence[]> {
    return this.stats!;
  }
  handle(parsedContent: { [p: string]: ParsedItem[] }, fileKey: string): void {
    // do nothing
  }

  finalizeParsing(): void {
    if (this.stats) return;
    this.stats = {};
    for (let file in this.preStats) {
      for (let section in this.preStats[file]) {
        for (let header in this.preStats[file][section]) {
          let occurrences: HeaderOccurrence[] = this.stats[header] || (this.stats[header] = []);
          occurrences.push({file, section});
        }
      }
    }
  }
}

export async function collectCaptions(entry: EntryInfo): Promise<Hash<HeaderOccurrence[]>> {
  const collector = new CaptionCollector();
  const tableParser = new ItemTableParser(collector);
  const fileParser = new ItemListDocumentParser(tableParser);
  const processor = new ListProcessor(fileParser, collector);
  await processor.processLists(entry);
  return collector.getStats();
}