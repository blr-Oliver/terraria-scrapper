import * as fs from 'fs';
import {ShortInfoCollection} from '../analyze/ShortInfoCollector';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {normalizeFileName} from '../fetch/fetch';
import {ALL_PLATFORMS, PlatformList, PlatformName, PlatformVaryingValue} from '../platform-varying';
import {loadDocument} from './common';
import {extractPlatformsFromImages} from './extract-varying';
import {MetaInfo, parseItemFromCard, ScrappedWeapon} from './parse-item';

export async function parseCards(entry: EntryInfo): Promise<void> {
  const collection: ShortInfoCollection = JSON.parse(await fs.promises.readFile(`${entry.out}/json/short-info.json`, {encoding: 'utf8'}));
  await ensureExists(`${entry.out}/json/pages`);
  const queue: Promise<void>[] = [];
  for (let key in collection.items) {
    const name = collection.items[key].name;
    if (!entry.excludeCards.some(x => x.toLowerCase() === key)) {
      queue.push(
          processCardName(entry, name).catch(ex => console.error(name, ex))
      );
    }
  }
  await Promise.allSettled(queue);
}
async function processCardName(entry: EntryInfo, name: string): Promise<void> {
  const fileName = normalizeFileName(name);
  const card = parseSinglePage(await loadDocument(`${entry.out}/html/cards/${fileName}.html`));
  return fs.promises.writeFile(`${entry.out}/json/pages/${fileName}.json`, JSON.stringify(card, null, 2), {encoding: 'utf8'});
}

export function parseSinglePage(document: Document): ScrappedWeapon[] {
  const contentRoot = document.querySelector('.mw-parser-output')!;
  let messageBox = contentRoot.querySelector('.message-box.msgbox-color-blue');
  let platforms: PlatformName[] = messageBox ? extractPlatformsFromImages(messageBox) : ALL_PLATFORMS as PlatformName[];
  let cardBlocks = contentRoot.querySelectorAll('.infobox.item');
  let result = Array.prototype.map.call(cardBlocks, block => {
    let meta: MetaInfo = {
      platforms: platforms.slice(),
      parsingExceptions: []
    }
    let weaponInfo = parseItemFromCard(block, meta);
    (weaponInfo as ScrappedWeapon).meta = meta;
    return weaponInfo as ScrappedWeapon;
  }) as ScrappedWeapon[];
  return maybeMerge(result);
}

function maybeMerge(items: ScrappedWeapon[]): ScrappedWeapon[] {
  let collection: { [name: string]: ScrappedWeapon } = {};
  let hasCollision = false;
  for (let item of items) {
    const platforms = item.meta!.platforms;
    const primaryPlatform = platforms[0];
    const name = item.name[primaryPlatform]!;
    if (!(name in collection)) {
      collection[name] = item;
    } else {
      hasCollision = true;
      mergeInto(collection[name], item, platforms);
    }
  }
  if (!hasCollision) return items;
  let result: ScrappedWeapon[] = [];
  for (let name in collection)
    result.push(collection[name]);
  return result;
}

function mergeInto(dest: ScrappedWeapon, src: ScrappedWeapon, platforms: PlatformList) {
  for (let property in src) {
    if (property === 'meta') continue;
    const srcElement: PlatformVaryingValue<any> = (src as any)[property];
    if (property in dest) {
      const destElement: PlatformVaryingValue<any> = (dest as any)[property];
      for (let platform of platforms) {
        destElement[platform] = srcElement[platform];
      }
    } else {
      (dest as any)[property] = srcElement;
    }
  }
  dest.meta!.platforms.push(...platforms);
  dest.meta!.parsingExceptions.push(...src.meta!.parsingExceptions);
}