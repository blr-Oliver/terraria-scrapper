import {EntryInfo} from '../../execution';
import {normalizeFileName} from '../../fetch/fetch';
import {loadDocument} from '../common';
import {ItemListCollector} from './ItemListCollector';
import {ItemListDocumentParser} from './ItemListDocumentParser';

export class ListProcessor<T> {
  constructor(
      private entry: EntryInfo,
      private fileParser: ItemListDocumentParser,
      private collector: ItemListCollector<T>) {
  }

  async processLists(): Promise<T> {
    let files: { key: string, path: string }[] =
        this.entry.lists.map(key => ({key, path: `${this.entry.out}/html/lists/${normalizeFileName(key)}.html`}))
    await Promise.allSettled(files.map(file => this.processFile(file.path, file.key)));
    return this.collector.finish();
  }

  private async processFile(path: string, key: string): Promise<void> {
    let document = await loadDocument(path);
    let content = this.fileParser.parseLists(document, key);
    try {
      this.collector.collect(content, key);
    } catch (ex) {
      console.error(ex);
    }
  }

}