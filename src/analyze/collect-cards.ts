import * as fs from 'fs';
import {ItemCard, ScrappedItem} from '../common/types';
import {EntryInfo} from '../execution';
import {normalizeFileName} from '../fetch/fetch';
import {ALL_PLATFORMS, PlatformVarying} from '../platform-varying';
import {ItemShortInfo} from './ShortInfoBuilder';


export interface CardRecord {
  name: string;
  commonName?: string;
  files: CardLocation[];
  exceptions?: any;
}

export interface CardLocation {
  pageTitle: string;
  fileName: string;
  index: number;
}

interface IntermediateCardRecord extends CardRecord {
  pages: { [pageTitle: string]: CardLocation };
}

export async function buildCardIndex(entry: EntryInfo): Promise<void> {
  const items: { [name: string]: ItemShortInfo } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/short-info.json`, {encoding: 'utf8'}));
  const collector = new CardIndexBuilder();
  const queue: Promise<void>[] = [];

  for (let key in items) {
    let itemInfo = items[key];
    let fileName = normalizeFileName(itemInfo.name);
    queue.push(
        fs.promises.readFile(`${entry.out}/json/pages/${fileName}.json`, {encoding: 'utf8'})
            .then(text => JSON.parse(text) as ScrappedItem[])
            .then(page => collector.collect(itemInfo.name, fileName, page))
    );
  }

  await Promise.allSettled(queue);
  collector.finish();

  return fs.promises.writeFile(`${entry.out}/json/cardIndex.json`, JSON.stringify(collector.finalData, null, 2), {encoding: 'utf8'});
}


class CardIndexBuilder {

  data: { [itemName: string]: IntermediateCardRecord } = {};
  finalData: { [itemName: string]: CardRecord } = {};

  collect(itemName: string, fileName: string, page: ScrappedItem[]) {
    for (let i = 0; i < page.length; i++) {
      let item = page[i];
      this.collectSingleItem(itemName, fileName, item, i, page.length === 1);
    }
  }

  private collectSingleItem(itemName: string, fileName: string, item: ScrappedItem, index: number, checkName: boolean) {
    const card = item.item;
    const pageTitle = card.pageTitle[item.platforms[0]]!;
    if (checkName && (itemName !== item.name || itemName != pageTitle || item.name !== pageTitle) || this.hasMultiId(card)) {
      this.collectMultiCard(itemName, fileName, pageTitle, item.name, index);
    } else {
      this.collectNormalCard(fileName, pageTitle, item.name, index);
    }
  }

  private collectNormalCard(fileName: string, pageTitle: string, cardName: string, index: number) {
    if (cardName in this.data) {
      this.addPage(this.data[cardName], pageTitle, fileName, index);
    } else
      this.data[cardName] = {
        name: cardName,
        files: [],
        pages: {
          [pageTitle]: {
            pageTitle,
            fileName,
            index
          }
        }
      }
  }

  private addPage(oldRecord: IntermediateCardRecord, pageTitle: string, fileName: string, index: number) {
    if (pageTitle in oldRecord.pages) {
      this.setWithNoConflicts(oldRecord, oldRecord.pages![pageTitle], 'fileName', fileName);
      this.setWithNoConflicts(oldRecord, oldRecord.pages![pageTitle], 'index', index);
    } else {
      oldRecord.pages[pageTitle] = {
        pageTitle,
        fileName,
        index
      };
    }
  }

  private collectMultiCard(itemName: string, fileName: string, pageTitle: string, cardName: string, index: number) {
    let oldRecord = this.data[itemName];
    if (oldRecord) {
      this.setWithNoConflicts(oldRecord, oldRecord, 'commonName', cardName);
      this.addPage(oldRecord, pageTitle, fileName, index);
    } else {
      this.data[itemName] = {
        name: itemName,
        files: [],
        commonName: cardName,
        pages: {
          [pageTitle]: {
            pageTitle,
            fileName,
            index
          }
        }
      }
    }
  }

  private setWithNoConflicts<T, K extends string & keyof T>(record: CardRecord, target: T, property: K, value: T[K]) {
    if (!target[property]) {
      target[property] = value;
    } else if (target[property] !== value)
      this.addException(record, `conflicting ${property}`, String(value));
  }

  private hasMultiId(card: PlatformVarying<ItemCard>): boolean {
    if (!card.id) return false;
    const idBundle = card.id!;
    for (let platform of ALL_PLATFORMS) {
      if (platform in idBundle) {
        let value = idBundle[platform]!;
        if (Array.isArray(value) && value.length > 1)
          return true;
      }
    }
    return false;
  }

  private addException(record: CardRecord, key: string, value: string) {
    if (!record.exceptions) record.exceptions = {};
    if (!(key in record.exceptions)) record.exceptions[key] = [];
    (record.exceptions[key] as string[]).push(value);
  }

  finish() {
    let names = Object.keys(this.data).sort();
    for (let name of names) {
      let oldRecord = this.data[name];
      let newRecord: CardRecord = {
        name,
        files: this.hashToList(oldRecord.pages)
      };
      if (oldRecord.commonName) newRecord.commonName = oldRecord.commonName;
      if (oldRecord.exceptions) newRecord.exceptions = oldRecord.exceptions;
      /*
      if (newRecord.files.length > 1)
        (newRecord as any).fileCount = newRecord.files.length;
       */
      this.finalData[name] = newRecord;
    }
  }

  private hashToList(hash: { [pageTitle: string]: CardLocation }): CardLocation[] {
    let titles = Object.keys(hash).sort();
    return titles.map(title => hash[title]);
  }
}