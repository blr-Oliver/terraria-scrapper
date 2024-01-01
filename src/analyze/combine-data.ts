import * as fs from 'fs';
import {ItemCard, ListSource, ScrappedItemWithSource} from '../common/types';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {ParsedSection} from '../parse/common';
import {PlatformVarying} from '../platform-varying';
import {CardIndex, CardLocation, CardRecord} from './collect-cards';
import {combineCards} from './combine';
import {ItemCategoryInfo} from './flatten-categories';
import {ListIndexRecord} from './ListIndexBuilder';

export async function compileCards(entry: EntryInfo): Promise<void> {
  const categoryData: { [name: string]: ItemCategoryInfo } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/category-info.json`, {encoding: 'utf8'}));
  const listIndex: { [name: string]: ListIndexRecord } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/listIndex.json`, {encoding: 'utf8'}));
  const cardIndex: CardIndex = JSON.parse(await fs.promises.readFile(`${entry.out}/json/cardIndex.json`, {encoding: 'utf8'}));

  let cardCompiler = new CardCompiler(entry, categoryData, listIndex, cardIndex);

  const allNames = Object.keys([categoryData, listIndex, cardIndex]
      .flatMap(o => Object.keys(o))
      .reduce((hash, name) => (hash[name] = true, hash), {} as { [name: string]: true })
  ).sort();

  await ensureExists(`${entry.out}/json/cards`);
  await cardCompiler.compileNormalCard('Bee Keeper');
}

async function compileItemCard(name: string, entry: EntryInfo, categoryInfo: ItemCategoryInfo | undefined, listRecord: ListIndexRecord | undefined, cardRecord: CardRecord | undefined): Promise<void> {
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

export class CardCompiler {
  constructor(
      private entry: EntryInfo,
      private categoryData: { [name: string]: ItemCategoryInfo },
      private listIndex: { [name: string]: ListIndexRecord },
      private cardIndex: CardIndex
  ) {
  }

  async compileNormalCard(name: string): Promise<ScrappedItemWithSource> {
    let sources: ScrappedItemWithSource[] = [];
    let listRecord = this.listIndex[name];
    if (listRecord)
      sources.push(...await loadListSources(this.entry, listRecord));
    let cardRecord = this.cardIndex.cards[name];
    if (cardRecord)
      sources.push(...await loadCardSources(this.entry, cardRecord));
    return this.compileFromSources(name, sources);
  }

  compileFromSources(name: string, sources: ScrappedItemWithSource[]): ScrappedItemWithSource {
    let platforms = sources[0].platforms.sort();
    let card = {} as PlatformVarying<ItemCard>;
    let result: ScrappedItemWithSource = {
      name,
      platforms,
      item: card,
      sources: [],
      exceptions: {}
    };
    for (let source of sources) {
      let otherPlatforms = source.platforms.sort();
      if (platforms.length !== otherPlatforms.length || platforms.some((x, i) => x !== otherPlatforms[i])) {
        result.exceptions['platform mismatch'] = true;
        platforms = [...new Set([...platforms, ...otherPlatforms]).keys()];
      }
      combineCards(card, source.item, platforms, result.exceptions);
      result.sources.push(...source.sources);
    }
    if (Object.keys(result.exceptions).length === 0)
      delete result.exceptions;
    return result;
  }

}