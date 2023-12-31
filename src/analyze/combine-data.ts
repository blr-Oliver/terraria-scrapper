import * as fs from 'fs';
import {ListSource, ScrappedItemWithSource} from '../common/types';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {ParsedSection} from '../parse/common';
import {CardIndex, CardLocation, CardRecord} from './collect-cards';
import {ItemCategoryInfo} from './flatten-categories';
import {ListIndexRecord} from './ListIndexBuilder';

export async function compileCards(entry: EntryInfo): Promise<void> {
  const categoryData: { [name: string]: ItemCategoryInfo } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/category-info.json`, {encoding: 'utf8'}));
  const listIndex: { [name: string]: ListIndexRecord } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/listIndex.json`, {encoding: 'utf8'}));
  const cardIndex: CardIndex = JSON.parse(await fs.promises.readFile(`${entry.out}/json/cardIndex.json`, {encoding: 'utf8'}));

  const allNames = Object.keys([categoryData, listIndex, cardIndex]
      .flatMap(o => Object.keys(o))
      .reduce((hash, name) => (hash[name] = true, hash), {} as { [name: string]: true })
  ).sort();

  await ensureExists(`${entry.out}/json/cards`);

  await Promise.allSettled(allNames.map(name => compileItemCard(name, entry, categoryData[name], listIndex[name], cardIndex.cards[name])));
}

async function compileItemCard(name: string, entry: EntryInfo, categoryInfo: ItemCategoryInfo | undefined, listRecord: ListIndexRecord | undefined, cardRecord: CardRecord | undefined): Promise<void> {
  let sources: ScrappedItemWithSource[] = [];
  if (listRecord)
    sources.push(...await loadListSources(entry, listRecord));
  if (cardRecord)
    sources.push(...await loadCardSources(entry, cardRecord));
  sources.length;
}

async function loadListSources(entry: EntryInfo, listRecord: ListIndexRecord): Promise<ScrappedItemWithSource[]> {
  return Promise.all(listRecord.sources.map(source => loadItemFromList(entry, source)));
}

async function loadItemFromList(entry: EntryInfo, source: ListSource): Promise<ScrappedItemWithSource> {
  let listPageContents: ParsedSection[] = JSON.parse(await fs.promises.readFile(`${entry.out}/json/lists/${source.filename}.json`, {encoding: 'utf8'}));
  return listPageContents[source.sectionIndex].items[source.itemIndex];
}

async function loadCardSources(entry: EntryInfo, cardRecord: CardRecord): Promise<ScrappedItemWithSource[]> {
  let result: ScrappedItemWithSource[] = await Promise.all(cardRecord.files.map(location => loadItemFromPage(entry, location)));
  result.forEach((item, i) => {
    item.pageTitle = cardRecord.files[i].pageTitle;
  })
  return result;
}

async function loadItemFromPage(entry: EntryInfo, source: CardLocation): Promise<ScrappedItemWithSource> {
  let cardPageContents: ScrappedItemWithSource[] = JSON.parse(await fs.promises.readFile(`${entry.out}/json/pages/${source.fileName}.json`, {encoding: 'utf8'}));
  return cardPageContents[source.index];
}