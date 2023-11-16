import * as fs from 'fs';
import {JSDOM} from 'jsdom';
import {EntryInfo} from '../../fetch/fetch-lists';
import {ItemListCollector} from './ItemListCollector';
import {ItemListDocumentParser} from './ItemListDocumentParser';

export class ListProcessor {
  constructor(
      private fileParser: ItemListDocumentParser,
      private collector: ItemListCollector) {
  }

  async processLists(entry: EntryInfo): Promise<void> {
    let files: { key: string, path: string }[] =
        entry.lists.map(key => ({key, path: `${entry.destRoot}/lists/${key}.html`}))
    await Promise.allSettled(files.map(file => this.processFile(file.path, file.key)));
    this.collector.finish();
  }

  private async processFile(path: string, key: string): Promise<void> {
    let document = await this.loadDocument(path);
    let content = this.fileParser.parseTablesPerSection(document, key);
    try {
      this.collector.collect(content, key);
    } catch (ex) {
      console.error(ex);
    }
  }

  private async loadDocument(file: string): Promise<Document> {
    const content = await fs.promises.readFile(file, {encoding: 'utf8'});
    return new JSDOM(content).window.document;
  }

}