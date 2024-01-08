import * as fs from 'fs';
import {ItemCard, ItemMetaInfo} from '../common/types';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {normalizeFileName} from '../fetch/fetch';
import {ALL_PLATFORMS, PlatformName} from '../platform-varying';
import {PackedItem} from './pack-cards';

export type JoinedData<T> = { [name: string]: T };
export type JoinKeys = PlatformName | 'base' | 'meta';
type KeyTypeMapping = {
  pc: ItemCard,
  console: ItemCard,
  mobile: ItemCard,
  threeDS: ItemCard,
  oldGen: ItemCard,
  base: ItemCard,
  meta: ItemMetaInfo
}
type JoinCollection = {
  [K in JoinKeys]: JoinedData<KeyTypeMapping[K]>
}

export async function concatCards(entry: EntryInfo): Promise<void> {
  const allNames: string[] = JSON.parse(await fs.promises.readFile(`${entry.out}/json/all-names.json`, {encoding: 'utf8'}));
  await ensureExists(`${entry.out}/json/joined`);
  let joined: JoinCollection = {
    pc: {},
    console: {},
    mobile: {},
    threeDS: {},
    oldGen: {},
    base: {},
    meta: {}
  };

  await Promise.allSettled(allNames.map(name => processName(entry, name, joined)));
  let keys = Object.keys(joined) as JoinKeys[];
  await Promise.allSettled(
      keys.map(key =>
          fs.promises.writeFile(`${entry.out}/json/joined/${key}.json`, JSON.stringify(joined[key], null, 2), {encoding: 'utf8'}))
  );
}

async function processName(entry: EntryInfo, name: string, joined: JoinCollection
): Promise<void> {
  const fileName = normalizeFileName(name);
  let packedItem: PackedItem = JSON.parse(await fs.promises.readFile(`${entry.out}/json/packed/${fileName}.json`, {encoding: 'utf8'}));
  delete (packedItem.meta as any).sources;
  delete packedItem.meta.exceptions;
  joined.meta![name] = packedItem.meta;
  joined.base[name] = packedItem.baseCard;
  if (packedItem.deviations) {
    for (let platform of ALL_PLATFORMS) {
      if (platform in packedItem.deviations)
        joined[platform][name] = packedItem.deviations[platform]!;
    }
  }
}