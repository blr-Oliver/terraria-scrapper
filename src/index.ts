import * as fs from 'fs';
import {findInAllCards} from './analyze/analyze-data';
import {mergeExceptions} from './analyze/analyze-exceptions';
import {EntryInfo} from './fetch/fetch-lists';
import {parallelLimit} from './fetch/FloodGate';
import {collectCaptions} from './parse/lists/collect-captions';
import {parseAll} from './parse/lists/parse-all';
import {getWeaponInfo, WeaponInfo} from './parse/weapon-card';
import {getWeaponCategories} from './parse/weapon-categories';
import {ALL_PLATFORMS, PlatformVaryingValue, pullToTop} from './platform-varying';

async function keypress(): Promise<void> {
  process.stdin.setRawMode(true);

  return new Promise(resolve => {
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

async function executeProgram(): Promise<void> {
  const entry = await loadEntry();
//  await loadWeaponList();
//  await loadWeaponCategories();
//  await loadCardsFromWeaponList();
//  await processExceptions();
//  await loadSingleWeapon({name: 'Bone Pickaxe', href: '/wiki/Bone_Pickaxe'});
//  await findMultiCards();
//  await fetchLists(entry);
//  await extractAllCaptions(entry);
  await parseAllData(entry);
}

async function processExceptions(): Promise<void> {
  console.log('Merging parsing exceptions...');
  console.log('Press any key to continue');
  await keypress();
  let data = mergeExceptions();
  console.log('Saving...');
  fs.writeFileSync('out/parsing-exceptions.json', JSON.stringify(data, null, 2), {encoding: 'utf8'});
  console.log('Done');
}

function forAnyPlatform<T>(test: (value: T) => boolean): (value: PlatformVaryingValue<T>) => boolean {
  return (value: PlatformVaryingValue<T>) => {
    for (let platform of ALL_PLATFORMS)
      if ((platform in value) && test(value[platform]!)) return true;
    return false;
  };
}

async function loadEntry() {
  let content = await fs.promises.readFile('src/entry.json', {encoding: 'utf8'});
  return JSON.parse(content);
}

async function parseAllData(entry: EntryInfo) {
  console.log('Press any key to continue');
  await keypress();
  const data = await parseAll(entry);
  await fs.promises.writeFile('out/data.json', JSON.stringify(data, null, 2), {encoding: 'utf8'});
}

async function extractAllCaptions(entry: EntryInfo) {
  console.log('Press any key to continue');
  await keypress();
  const captions = await collectCaptions(entry);
  await fs.promises.writeFile('out/captions.json', JSON.stringify(captions, null, 2), {encoding: 'utf8'});
}

async function findMultiCards(): Promise<void> {
  console.log('Searching for multi-cards...');
  console.log('Press any key to continue');
  await keypress();
  let multiCards = findInAllCards(forAnyPlatform(item => (item.id instanceof Array)));
  console.log('Saving...');
  fs.writeFileSync('out/multi-cards.json', JSON.stringify(multiCards, null, 2), {encoding: 'utf8'});
  console.log('Done');
}

async function loadWeaponCategories() {
  console.log('Loading weapon categories...');
  console.log('Press any key to continue');
  await keypress();
  let weaponCategories = await getWeaponCategories();
  console.log('Saving...');
  fs.writeFileSync('out/weapon-categories.json', JSON.stringify(weaponCategories, null, 2), {encoding: 'utf8'});
  console.log('Done');
}

type CardLocator = {
  name: string,
  href: string
}

async function loadSingleWeapon(card: CardLocator, waitUser: boolean = true, silent: boolean = false): Promise<void> {
  if (!silent)
    console.log(`Loading weapon from '${card.href}' ...`);
  if (waitUser) {
    if (!silent) console.log('Press any key to continue');
    await keypress();
  }
  let weaponInfo = await getWeaponInfo(card.href);
  if (!silent)
    console.log('Collapsing...');
  const meta = weaponInfo.meta!;
  delete weaponInfo.meta;
  let collapsed = pullToTop<WeaponInfo>(weaponInfo, meta?.platforms);
  if (meta.parsingExceptions.length) {
    (collapsed as any).parsingExceptions = meta.parsingExceptions;
  }
  if (!silent)
    console.log('Saving...');
  fs.writeFileSync(getFileName(card), JSON.stringify(collapsed, null, 2), {encoding: 'utf8'});
  if (!silent)
    console.log('Done');
}
function getFileName(card: CardLocator) {
  let cleanName = card.name.replaceAll(':', '');
  return `out/cards/${cleanName}.json`;
}
async function loadCardsFromWeaponList(): Promise<void> {
  let data: string = fs.readFileSync('out/weapon-list.json', {encoding: 'utf8'});
  let cards = (JSON.parse(data) as any[]).map(info => info.name as CardLocator);
  await loadCards(cards);
}

async function loadCards(cards: CardLocator[]): Promise<void> {
  const loader: (card: CardLocator) => Promise<void> = card => loadSingleWeapon(card, false, true)
      .catch((err) => {
        console.error(`Failed processing of ${card.name}`);
        console.error(err);
      });
  const parallelLoader = parallelLimit(loader, 5, 500);
  await Promise.all(cards
      .filter(card => !fs.existsSync(getFileName(card)))
      .map(card => parallelLoader(card))
  );
}

executeProgram().then(() => process.exit(0));
