import * as fs from 'fs';
import {Item, ItemCard, ItemMetaInfo} from '../common/types';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {normalizeFileName} from '../fetch/fetch';
import {pack} from '../packed-varying';
import {PlatformList, PlatformVaryingValue} from '../platform-varying';

export interface PackedCard {
  name: string;
  meta: ItemMetaInfo;
  baseCard: ItemCard;
  deviations?: PlatformVaryingValue<ItemCard>;
}

export async function packCards(entry: EntryInfo): Promise<void> {
  const allNames: string[] = JSON.parse(await fs.promises.readFile(`${entry.out}/json/all-names.json`, {encoding: 'utf8'}));
  await ensureExists(`${entry.out}/json/packed`);
  await Promise.allSettled(allNames.map(name => packCard(entry, name)));
}

async function packCard(entry: EntryInfo, name: string): Promise<void> {
  let fileName = normalizeFileName(name);
  let item: Item = JSON.parse(await fs.promises.readFile(`${entry.out}/json/combined/${fileName}.json`, {encoding: 'utf8'}));
  let result: PackedCard = {
    name: item.name,
    meta: item.meta,
    baseCard: {}
  }
  let sourceCard = item.card;
  let properties = Object.keys(sourceCard) as (keyof ItemCard)[];
  let base = result.baseCard;
  let deviations = {} as PlatformVaryingValue<ItemCard>;
  for (let property of properties) {
    packProperty(property, sourceCard[property]!, base, deviations, item.meta.platforms);
  }
  if (Object.keys(deviations).length)
    result.deviations = deviations;
  return fs.promises.writeFile(`${entry.out}/json/packed/${fileName}.json`, JSON.stringify(result, null, 2), {encoding: 'utf8'});
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