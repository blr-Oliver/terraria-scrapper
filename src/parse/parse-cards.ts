import * as fs from 'fs';
import {ShortInfoCollection} from '../analyze/ShortInfoCollector';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {normalizeFileName} from '../fetch/fetch';
import {ALL_PLATFORMS, PlatformName} from '../platform-varying';
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
  return Array.prototype.map.call(cardBlocks, block => {
    let meta: MetaInfo = {
      platforms: platforms.slice(),
      parsingExceptions: []
    }
    let weaponInfo = parseItemFromCard(block, meta);
    (weaponInfo as ScrappedWeapon).meta = meta;
    return weaponInfo as ScrappedWeapon;
  }) as ScrappedWeapon[];
}