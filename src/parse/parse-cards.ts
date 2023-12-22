import * as fs from 'fs';
import {ShortInfoCollection} from '../analyze/ShortInfoCollector';
import {ItemCard, ScrappedItem, ScrappedItemWithSource} from '../common/types';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {normalizeFileName} from '../fetch/fetch';
import {ALL_PLATFORMS, PlatformList, PlatformName} from '../platform-varying';
import {loadDocument} from './common';
import {extractPlatformsFromImages} from './extract-varying';
import {parseItemFromCard} from './parse-item';

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
  const filename = normalizeFileName(name);
  const card = parseSinglePage(await loadDocument(`${entry.out}/html/cards/${filename}.html`), filename);
  return fs.promises.writeFile(`${entry.out}/json/pages/${filename}.json`, JSON.stringify(card, null, 2), {encoding: 'utf8'});
}

function parseSinglePage(document: Document, filename: string): ScrappedItem[] {
  const contentRoot = document.querySelector('.mw-parser-output')!;
  let messageBox = contentRoot.querySelector('.message-box.msgbox-color-blue');
  let platforms: PlatformName[] = messageBox ? extractPlatformsFromImages(messageBox) : ALL_PLATFORMS as PlatformName[];
  let cardBlocks = contentRoot.querySelectorAll('.infobox.item');
  let result = Array.prototype.map.call(cardBlocks, (block: Element, i: number) => {
    let result = parseItemFromCard(block, platforms) as ScrappedItemWithSource;
    result.sources = [{
      type: 'card',
      filename,
      index: i
    }];
    return result;
  }) as ScrappedItemWithSource[];
  return maybeMerge(result);
}

function maybeMerge(items: ScrappedItemWithSource[]): ScrappedItemWithSource[] {
  let collection: { [name: string]: ScrappedItemWithSource } = {};
  let hasCollision = false;
  for (let item of items) {
    const platforms = item.platforms;
    const name = item.name;
    if (!(name in collection)) {
      collection[name] = item;
    } else {
      hasCollision = true;
      mergeInto(collection[name], item, platforms);
    }
  }
  if (!hasCollision) return items;
  let result: ScrappedItemWithSource[] = [];
  for (let name in collection)
    result.push(collection[name]);
  return result;
}

function mergeInto(dest: ScrappedItemWithSource, src: ScrappedItemWithSource, platforms: PlatformList) {
  for (let property in src.item) {
    let itemCardProperty = property as keyof ItemCard;
    const srcElement = src.item[itemCardProperty]!;
    if (property in dest.item) {
      const destElement = dest.item[itemCardProperty]!;
      for (let platform of platforms) {
        destElement[platform] = srcElement[platform];
      }
    } else {
      (dest.item as any)[itemCardProperty] = srcElement;
    }
  }
  dest.platforms.push(...platforms);
  dest.exceptions.push(...src.exceptions);
  dest.sources.push(...src.sources);
}