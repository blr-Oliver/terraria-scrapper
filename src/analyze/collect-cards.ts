import * as fs from 'fs';
import {ItemCard, ScrappedItem} from '../common/types';
import {EntryInfo} from '../execution';
import {normalizeFileName} from '../fetch/fetch';
import {PlatformName, PlatformVaryingValue} from '../platform-varying';
import {ShortInfoCollection} from './ShortInfoCollector';

export interface CardLocation {
  name: string;
  fileName: string;
  itemIndex: number
}

export interface CardIndex {
  cards: {
    [key: string]: CardLocation
  };
  multiCards: string[];
  multiCardRefs: {
    [key: string]: string
  };
}

export async function collectCards(entry: EntryInfo): Promise<void> {
  const collection: ShortInfoCollection = JSON.parse(await fs.promises.readFile(`${entry.out}/json/short-info.json`, {encoding: 'utf8'}));
  const collector = new CardIndexCollector();
  const queue: Promise<void>[] = [];

  for (let key in collection.items) {
    let itemInfo = collection.items[key];
    let fileName = normalizeFileName(itemInfo.name);
    queue.push(
        fs.promises.readFile(`${entry.out}/json/pages/${fileName}.json`, {encoding: 'utf8'})
            .then(text => JSON.parse(text) as ScrappedItem[])
            .then(page => collector.collect(itemInfo.name, fileName, page))
    );
  }

  await Promise.allSettled(queue);
  collector.finish();

  return fs.promises.writeFile(`${entry.out}/json/card-index.json`, JSON.stringify(collector, null, 2), {encoding: 'utf8'});
}


class CardIndexCollector implements CardIndex {
  cards: { [key: string]: CardLocation } = {};
  multiCards: string[] = [];
  multiCardRefs: { [key: string]: string } = {};
  multiCardsSet?: Set<string> = new Set<string>();

  collect(itemName: string, fileName: string, page: ScrappedItem[]) {
    for (let i = 0; i < page.length; ++i) {
      const card = page[i];
      const primaryPlatform = this.getPrimaryPlatform(card);
      let cardName: string | string[] = card.name;
      if (this.isMultiCard(card, primaryPlatform)) {
        this.multiCardsSet!.add(cardName);
        this.multiCardRefs[itemName] = cardName;
      }
      this.cards[cardName] = {
        name: cardName,
        fileName,
        itemIndex: i
      }
    }
  }

  isMultiCard(item: ScrappedItem, primaryPlatform: PlatformName): boolean {
    const itemCard = item.item;
    return ['id', 'name'].some(property => {
      if (!(property in itemCard)) return false;
      let value = itemCard[property as keyof ItemCard] as PlatformVaryingValue<any>;
      return Array.isArray(value[primaryPlatform]);
    });
  }

  getPrimaryPlatform(itemCard: ScrappedItem): PlatformName {
    return itemCard.platforms[0];
  }

  finish() {
    this.multiCards = [...this.multiCardsSet!.keys()];
    delete this.multiCardsSet;
  }
}