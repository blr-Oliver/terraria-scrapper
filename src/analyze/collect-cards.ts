import * as fs from 'fs';
import {Item, ItemCard} from '../common/types';
import {sortKeys} from '../common/utils';
import {EntryInfo} from '../execution';
import {normalizeFileName} from '../fetch/fetch';
import {ALL_PLATFORMS, PlatformVarying} from '../platform-varying';
import {ItemShortInfo} from './ShortInfoBuilder';


export interface CardRecord {
  name: string;
  isMulti?: true;
  isGroup?: true;
  groupName?: string;
  files: CardLocation[];
  exceptions?: any;
}

export interface CardLocation {
  pageTitle: string;
  fileName: string;
  index: number;
}

interface CardCollectionRecord {
  name: string;
  exceptions?: any;
  missingId: boolean;
  pages: { [pageTitle: string]: CardLocation };
}

export interface CardIndex {
  cards: { [itemName: string]: CardRecord };
  multiCards: { [commonName: string]: string[] };
  multiCardRefs: { [itemName: string]: string };
  groups: { [groupName: string]: string[] };
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
            .then(text => JSON.parse(text) as Item[])
            .then(page => collector.collect(itemInfo.name, fileName, page))
    );
  }

  await Promise.allSettled(queue);
  collector.finish();

  return fs.promises.writeFile(`${entry.out}/json/cardIndex.json`, JSON.stringify(collector, null, 2), {encoding: 'utf8'});
}


class CardIndexBuilder implements CardIndex {
  data: { [itemName: string]: CardCollectionRecord } = {};
  cards: { [itemName: string]: CardRecord } = {};
  multiCards: { [commonName: string]: string[] } = {};
  multiCardRefs: { [itemName: string]: string } = {};
  groups: { [groupName: string]: string[] } = {};

  collect(itemName: string, fileName: string, page: Item[]) {
    for (let i = 0; i < page.length; i++) {
      let item = page[i];
      this.collectSingleItem(itemName, fileName, item, i, page.length === 1);
    }
  }

  private collectSingleItem(itemName: string, fileName: string, item: Item, index: number, checkName: boolean) {
    const card = item.card;
    const pageTitle = item.meta.pageTitle!;
    if (checkName && (itemName !== item.name || itemName != pageTitle || item.name !== pageTitle) || this.hasMultiId(card)) {
      this.collectMultiCard(itemName, fileName, pageTitle, item.name, index);
    } else {
      this.collectNormalCard(fileName, pageTitle, item.name, item, index);
    }
  }

  private collectNormalCard(fileName: string, pageTitle: string, cardName: string, item: Item, index: number) {
    let oldRecord = this.data[cardName];
    if (oldRecord) {
      this.addPage(oldRecord, pageTitle, fileName, index);
      oldRecord.missingId &&= !item.card.id;
    } else
      this.data[cardName] = oldRecord = {
        name: cardName,
        missingId: !item.card.id,
        pages: {
          [pageTitle]: {
            pageTitle,
            fileName,
            index
          }
        }
      }
  }


  private collectMultiCard(itemName: string, fileName: string, pageTitle: string, cardName: string, index: number) {
    let oldRecord = this.data[cardName];
    let oldMark = this.multiCards[cardName];
    if (oldRecord) {
      this.addPage(oldRecord, pageTitle, fileName, index);
    } else {
      this.data[cardName] = {
        name: cardName,
        missingId: false,
        pages: {
          [pageTitle]: {
            pageTitle,
            fileName,
            index
          }
        }
      }
    }
    if (oldMark) {
      oldMark.push(itemName);
    } else {
      this.multiCards[cardName] = [itemName];
    }
    this.multiCardRefs[itemName] = cardName;
  }

  private addPage(oldRecord: CardCollectionRecord, pageTitle: string, fileName: string, index: number) {
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

  private setWithNoConflicts<T, K extends string & keyof T>(record: CardCollectionRecord, target: T, property: K, value: T[K]) {
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

  private addException(record: CardCollectionRecord, key: string, value: string) {
    if (!record.exceptions) record.exceptions = {};
    if (!(key in record.exceptions)) record.exceptions[key] = [];
    (record.exceptions[key] as string[]).push(value);
  }

  finish() {
    let names = Object.keys(this.data).sort();
    let possibleChildRecords: CardRecord[] = [];
    for (let name of names) {
      let oldRecord = this.data[name];
      let newRecord: CardRecord = {
        name,
        files: this.hashToList(oldRecord.pages)
      };
      if (oldRecord.exceptions) newRecord.exceptions = oldRecord.exceptions;
      if (this.multiCards[name]) {
        newRecord.isMulti = true;
        this.removeExpectedConflicts(newRecord, this.multiCards[name]);
      }
      if (newRecord.files.length === 1) {
        if (newRecord.files[0].pageTitle !== name)
          possibleChildRecords.push(newRecord);
      }
      /*
      if (newRecord.files.length > 1)
        (newRecord as any).fileCount = newRecord.files.length;
       */
      this.cards[name] = newRecord;
    }

    this.finishGroups(possibleChildRecords);

    this.cards = sortKeys(this.cards);
    this.multiCards = sortKeys(this.multiCards);
    this.multiCardRefs = sortKeys(this.multiCardRefs);

    delete (this as any).data;
  }

  private finishGroups(children: CardRecord[]) {
    let groups: { [groupName: string]: string[] } = {};
    for (let child of children) {
      const groupName = child.files[0].pageTitle;
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(child.name);
    }

    for (let groupName in groups) {
      if (this.isGroup(groupName)) {
        let children = groups[groupName];
        this.groups[groupName] = children.sort();
        for (let childName of children) {
          let child = this.cards[childName];
          child.groupName = groupName;
          this.removeExpectedConflicts(child, children);
        }
        const groupCard = this.cards[groupName];
        if (groupCard) {
          groupCard.isGroup = true;
          this.removeExpectedConflicts(groupCard, children);
        }
      }
    }
  }

  private removeExpectedConflicts(record: CardRecord, conflicts: string[]) {
    let otherFiles: string[] | undefined = record?.exceptions['conflicting fileName'];
    if (otherFiles) {
      if (otherFiles.every(file => conflicts.some(childName => childName === file))) {
        delete record.exceptions['conflicting fileName'];
        if (Object.keys(record.exceptions).length === 0)
          delete record.exceptions;
      }
    }
  }

  private isGroup(groupName: string): boolean {
    let groupCard = this.cards[groupName];
    if (!groupCard) return true;
    return this.data[groupName].missingId;
  }

  private hashToList(hash: { [pageTitle: string]: CardLocation }): CardLocation[] {
    let titles = Object.keys(hash).sort();
    return titles.map(title => hash[title]);
  }
}