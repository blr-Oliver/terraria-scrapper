import * as fs from 'fs';
import {ItemCard, ScrappedItemWithSource} from '../common/types';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {normalizeFileName} from '../fetch/fetch';
import {pack} from '../packed-varying';
import {PlatformList, PlatformVaryingValue} from '../platform-varying';

export async function packCards(entry: EntryInfo): Promise<void> {
  const allNames: string[] = JSON.parse(await fs.promises.readFile(`${entry.out}/json/all-names.json`, {encoding: 'utf8'}));
  await ensureExists(`${entry.out}/json/packed`);
  await Promise.allSettled(allNames.map(name => packCard(entry, name)));
}

async function packCard(entry: EntryInfo, name: string): Promise<void> {
  let fileName = normalizeFileName(name);
  let item: ScrappedItemWithSource = JSON.parse(await fs.promises.readFile(`${entry.out}/json/combined/${fileName}.json`, {encoding: 'utf8'}))
  let sourceCard = item.item;
  let properties = Object.keys(sourceCard) as (keyof ItemCard)[];
  let base = {} as ItemCard;
  let deviations = {} as PlatformVaryingValue<ItemCard>;
  for (let property of properties) {
    packProperty(property, sourceCard[property]!, base, deviations, item.platforms);
  }
  let packedItem = {
    base,
    platforms: item.platforms
  };
  if (Object.keys(deviations).length)
    (packedItem as any).deviations = deviations;
  return fs.promises.writeFile(`${entry.out}/json/packed/${fileName}.json`, JSON.stringify(packedItem, null, 2), {encoding: 'utf8'});
}

function packProperty<K extends keyof ItemCard>(property: K, source: PlatformVaryingValue<ItemCard[K]>, base: ItemCard, deviations: PlatformVaryingValue<ItemCard>, platforms: PlatformList) {
  let packed = pack(source, platforms);
  if ('base' in packed) {
    base[property] = packed.base! as ItemCard[K];
  }
  if (packed.varying) {
    let varPlatforms = Object.keys(packed.varying) as PlatformList;
    for (let platform of varPlatforms) {
      if (!(platform in deviations))
        deviations[platform] = {} as ItemCard;
      deviations[platform]![property] = packed.varying[platform]! as ItemCard[K];
    }
  }
}