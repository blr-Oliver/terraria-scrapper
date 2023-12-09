import * as fs from 'fs';
import {EntryInfo} from '../../../execution';
import {ParsedSection} from '../../common';
import {ItemListCollector} from '../ItemListCollector';

export class SavingCollector implements ItemListCollector<Promise<void>> {
  private saveTasks: Promise<void>[] = [];

  constructor(private entry: EntryInfo) {
  }

  collect(fileContent: ParsedSection[], fileKey: string): void {
    this.saveTasks.push(
        fs.promises.writeFile(`${this.entry.out}/json/lists/${fileKey}.json`, JSON.stringify(fileContent, null, 2), {encoding: 'utf8'})
    );
  }

  finish(): Promise<void> {
    return Promise.all(this.saveTasks).then(() => {
    });
  }
}