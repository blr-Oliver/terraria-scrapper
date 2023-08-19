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
    let files: { key: string, path: string }[] =
        entry.lists.map(key => ({key, path: `${entry.destRoot}/lists/${key}.html`}))
    await Promise.allSettled(files.map(file => this.processFile(file.path, file.key)));
    this.handler.finalizeParsing();
  }

  private async processFile(path: string, key: string): Promise<void> {
    let document = await this.loadDocument(path);
    let content = this.fileParser.parseTablesPerSection(document, key);
    try {
      this.handler.handle(content, key);
    } catch (ex) {
      console.error(ex);
    }
  }

  private async loadDocument(file: string): Promise<Document> {
    const content = await fs.promises.readFile(file, {encoding: 'utf8'});
    return new JSDOM(content).window.document;
  }

}