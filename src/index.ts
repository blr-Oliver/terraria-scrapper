import * as fs from 'fs';
import {findInAllCards} from './analyze/analyze-data';
import {mergeExceptions} from './analyze/analyze-exceptions';
import {EntryInfo} from './fetch/fetch-lists';
import {parallelLimit} from './fetch/FloodGate';
import {ItemDescriptor} from './parse/lists/cell-parsers';
import {collectCaptions} from './parse/lists/collect-captions';
import {parseAll} from './parse/lists/parse-all';
import {getWeaponInfo, WeaponInfo} from './parse/weapon-card';
import {getWeaponCategories} from './parse/weapon-categories';
import {ALL_PLATFORMS, PlatformName, PlatformVaryingValue, pullToTop} from './platform-varying';

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
  const entry = await executeRoutine(loadEntry, 'Loading entry point...', false
      //, 'src/entry-short.json'
  );
//  await loadWeaponList();
//  await loadWeaponCategories();
//  await loadCardsFromWeaponList();
//  await processExceptions();
//  await loadSingleWeapon({name: 'Bone Pickaxe', href: '/wiki/Bone_Pickaxe'});
//  await findMultiCards();
//  await fetchLists(entry);
//  await extractAllCaptions(entry);
  let data = await executeRoutine(parseAll, 'Parsing lists...', false, entry);
  let pivoted = await executeRoutine(() => pullToTop<{ [name: string]: ItemDescriptor }>(data),
      'Separating platform variants...', false);
  for (let platform in pivoted) {
    await saveWithPrompt(`out/platforms/${platform}.json`, pivoted[platform as PlatformName], `Saving ${platform} data`);
  }
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

async function loadEntry(path = 'src/entry.json') {
  let content = await fs.promises.readFile(path, {encoding: 'utf8'});
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

async function executeRoutine<T extends (...args: any) => any>(
    routine: T, prompt: string | undefined, awaitKeyPress: boolean,
    ...params: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
  if (prompt)
    console.log(prompt);
  if (awaitKeyPress) {
    console.log('Press any key to continue');
    await keypress();
  }
  let result = await Promise.resolve(routine(...(params as any[])));
  if (prompt || awaitKeyPress)
    console.log('Done');
  return result;
}

async function saveWithPrompt(path: string, data: any, prompt: string = 'Saving...'): Promise<void> {
  console.log(prompt);
  await fs.promises.writeFile(path, JSON.stringify(data, null, 2), {encoding: 'utf8'});
  console.log('Done');
}