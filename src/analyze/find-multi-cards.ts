import * as fs from 'fs';
import {EntryInfo} from '../execution';
import {normalizeFileName} from '../fetch/fetch';
import {ScrappedWeapon} from '../parse/parse-item';
import {PlatformVaryingValue} from '../platform-varying';
import {Varying} from '../varying';
import {ShortInfoCollection} from './ShortInfoCollector';

interface MultiCardRecord {
  id?: number | number[];
  cardName: string;
  itemName: string;
}

export interface MultiCardGroup {
  itemNames: string[];
  ids: number[];
}

export async function findMultiCards(entry: EntryInfo): Promise<void> {
  const collection: ShortInfoCollection = JSON.parse(await fs.promises.readFile(`${entry.out}/json/short-info.json`, {encoding: 'utf8'}));
  const queue: Promise<MultiCardRecord | undefined>[] = [];
  for (let key in collection.items) {
    const name = collection.items[key].name;
    if (!entry.excludeCards.some(x => x.toLowerCase() === key)) {
      queue.push(getMultiCardRecord(entry, name));
    }
  }
  let multiCards = (await Promise.all(queue)).filter(x => !!x) as MultiCardRecord[];
  let result: { [cardName: string]: MultiCardGroup } = {};
  for (let record of multiCards) {
    let key = record.cardName;
    if (!(key in result)) {
      result[key] = {
        itemNames: [],
        ids: []
      };
    }
    result[key].itemNames.push(record.itemName)
    if (typeof record.id === 'number')
      result[key].ids.push(record.id);
    else
      result[key].ids = record.id as number[];
  }
  return await fs.promises.writeFile(`${entry.out}/json/multi-cards.json`, JSON.stringify(result, null, 2), {encoding: 'utf8'});
}

async function getMultiCardRecord(entry: EntryInfo, name: string): Promise<MultiCardRecord | undefined> {
  const fileName = normalizeFileName(name);
  let card: ScrappedWeapon = JSON.parse(await fs.promises.readFile(`${entry.out}/json/cards/${fileName}.json`, {encoding: 'utf8'}));
  let cardName = getFirstValue(card.name)!;
  let id = getFirstValue(card.id as PlatformVaryingValue<number>);
  if (cardName.toLowerCase() !== name.toLowerCase() || id && Array.isArray(id))
    return {
      itemName: name,
      cardName,
      id
    };
}

function getFirstValue<T>(value: Varying<T, any>): T | undefined {
  if (value) {
    let keys = Object.keys(value);
    return keys.length ? (value as any)[keys[0]] : undefined;
  }
}