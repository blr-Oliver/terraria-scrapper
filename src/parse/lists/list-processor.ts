import * as fs from 'fs';
import {JSDOM} from 'jsdom';
import {EntryInfo} from '../../fetch/fetch-lists';
import {ParsedItem} from './cell-parsers';
import {ItemListDocumentParser} from './parse-list-file';

export interface ContentHandler {
  handle(parsedContent: { [p: string]: ParsedItem[] }, fileKey: string): void;
  finalizeParsing(): void;
}

export class ListProcessor {
  constructor(
      private fileParser: ItemListDocumentParser,
      private handler: ContentHandler) {
  }

  async processLists(entry: EntryInfo): Promise<void> {
    let files: string[] = Array(entry.lists.length + 1);
    files[0] = `${entry.destRoot}/Global List.html`;
    for (let i = 0; i < entry.lists.length; ++i)
      files[i + 1] = `${entry.destRoot}/lists/${entry.lists[i]}.html`;
    await Promise.allSettled(files.map(file => this.processFile(file)));
    this.handler.finalizeParsing();
  }

  private async processFile(file: string): Promise<void> {
    let document = await this.loadDocument(file);
    let content = this.fileParser.parseTablesPerSection(document, file);
    try {
      this.handler.handle(content, file);
    } catch (ex) {
      console.error(ex);
    }
  }

  private async loadDocument(file: string): Promise<Document> {
    const content = await fs.promises.readFile(file, {encoding: 'utf8'});
    return new JSDOM(content).window.document;
  }

}