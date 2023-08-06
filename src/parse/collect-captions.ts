import * as fs from 'fs';
import {JSDOM} from 'jsdom';
import {EntryInfo} from '../fetch/fetch-lists';
import {CellParser, HeaderContext} from './cell-parsers';
import {ParserProvider} from './parse-table';

export type HeaderOccurrence = {
  file: string;
  section: string;
}

type Hash<T> = {
  [key: string]: T;
}

export class CollectingParserProvider implements ParserProvider {
  private preStats: Hash<Hash<Hash<boolean>>> = {};
  private stats?: Hash<HeaderOccurrence[]>;

  getParser(header: HeaderContext): CellParser | undefined {
    this.collectHeaderInfo(header);
    return () => this.finalizeStats();
  }

  collectHeaderInfo(header: HeaderContext) {
  }

  finalizeStats() {
    if (this.stats) return;
    this.stats = {};
    for (let header in this.preStats) {
      let occurrences: HeaderOccurrence[] = this.stats[header] = [];
      for (let file in this.preStats[header]) {
        for (let section in this.preStats[header][file])
          occurrences.push({file, section});
      }
    }
  }

  getStats(): { [header: string]: HeaderOccurrence[] } {
    return this.stats!;
  }
}

export async function collectAllTableCaptions(entry: EntryInfo): Promise<string[]> {
  let files: string[] = Array(entry.lists.length + 1);
  files[0] = `${entry.destRoot}/Global List.html`;
  for (let i = 0; i < entry.lists.length; ++i)
    files[i + 1] = `${entry.destRoot}/lists/${entry.lists[i]}.html`;

  let allCaptions: { [key: string]: true } = {};
  await Promise.all(files.map(file => collectTableCaptions(file, allCaptions)));
  return Object.keys(allCaptions).sort();
}

async function collectTableCaptions(file: string, allCaptions: { [key: string]: true }): Promise<void> {
  const content = await fs.promises.readFile(file, {encoding: 'utf8'});
  let document = new JSDOM(content).window.document;
  document
      .querySelectorAll<HTMLTableElement>('table.terraria.sortable')
      .forEach(table => extractCaptions(table, allCaptions));
}

function extractCaptions(table: HTMLTableElement, allCaptions: { [key: string]: true }): void {
  const headerRow = !!table.tHead ? table.tHead.rows[0] : table.tBodies[0].rows[0];
  const cellNum = headerRow.cells.length;
  for (let i = 0; i < cellNum; ++i) {
    let caption = headerRow.cells[i].textContent!.trim();
    allCaptions[caption] = true;
  }
}