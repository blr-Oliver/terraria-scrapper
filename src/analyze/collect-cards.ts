import * as fs from 'fs';
import {ItemCard, ScrappedItem} from '../common/types';
import {sortKeys} from '../common/utils';
import {EntryInfo} from '../execution';
import {normalizeFileName} from '../fetch/fetch';
import {ALL_PLATFORMS, PlatformVarying} from '../platform-varying';
import {ItemShortInfo} from './ShortInfoBuilder';

export interface CardRecord {
  name: string;
  commonName?: string;
  pageTitle?: string;
  fileName: string;
  index: number;
  exceptions?: any;
}

export async function collectCards(entry: EntryInfo): Promise<void> {
  const items: { [name: string]: ItemShortInfo } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/short-info.json`, {encoding: 'utf8'}));
  const collector = new CardIndexCollector();
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

  return fs.promises.writeFile(`${entry.out}/json/cardIndex.json`, JSON.stringify(collector.data, null, 2), {encoding: 'utf8'});
}


class CardIndexCollector {

  data: { [itemName: string]: CardRecord } = {};

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
      this.collectMultiCard(itemName, fileName, pageTitle, item, index);
    } else {
      this.collectNormalCard(itemName, fileName, index);
    }
  }

  private collectNormalCard(itemName: string, fileName: string, index: number) {
    if (!(itemName in this.data)) {
      this.data[itemName] = {
        name: itemName,
        fileName,
        index
      }
    }
  }

  private collectMultiCard(itemName: string, fileName: string, pageTitle: string, item: ScrappedItem, index: number) {
    let oldRecord = this.data[itemName];
    if (oldRecord) {
      this.setWithNoConflicts(oldRecord, 'commonName', item.name);
      this.setWithNoConflicts(oldRecord, 'pageTitle', pageTitle);
      this.setWithNoConflicts(oldRecord, 'index', index);
    } else {
      this.data[itemName] = {
        name: itemName,
        commonName: item.name,
        pageTitle: pageTitle,
        fileName,
        index: index
      }
    }
  }

  private setWithNoConflicts<K extends keyof CardRecord>(oldRecord: CardRecord, property: K, value: CardRecord[K]) {
    if (!oldRecord[property]) {
      oldRecord[property] = value;
    } else if (oldRecord[property] !== value)
      this.addException(oldRecord, `conflicting ${property}`, value);
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
    this.data = sortKeys(this.data);
  }
}