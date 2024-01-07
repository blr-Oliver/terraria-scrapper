import * as fs from 'fs';
import {Item, ItemCard, ListSource} from '../common/types';
import {addException} from '../common/utils';
import {EntryInfo} from '../execution';
import {ensureExists} from '../fetch/common';
import {normalizeFileName} from '../fetch/fetch';
import {ParsedSection} from '../parse/common';
import {PlatformVarying} from '../platform-varying';
import {CardIndex, CardLocation, CardRecord} from './collect-cards';
import {combineCards} from './combine';
import {ItemCategoryInfo} from './flatten-categories';
import {ListIndexRecord} from './ListIndexBuilder';

export async function combineSources(entry: EntryInfo): Promise<void> {
  const categoryData: { [name: string]: ItemCategoryInfo } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/category-info.json`, {encoding: 'utf8'}));
  const listIndex: { [name: string]: ListIndexRecord } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/listIndex.json`, {encoding: 'utf8'}));
  const cardIndex: CardIndex = JSON.parse(await fs.promises.readFile(`${entry.out}/json/cardIndex.json`, {encoding: 'utf8'}));

  let cardCompiler = new CardCompiler(entry, categoryData, listIndex, cardIndex);

  const allNames = Object.keys([categoryData, listIndex, cardIndex.cards]
      .flatMap(o => Object.keys(o))
      .reduce((hash, name) => (hash[name] = true, hash), {} as { [name: string]: true })
  ).sort();

  await ensureExists(`${entry.out}/json/combined`);
  await Promise.allSettled(allNames.map(name => cardCompiler.compileItem(name)));
  return fs.promises.writeFile(`${entry.out}/json/all-names.json`, JSON.stringify(allNames, null, 2), {encoding: 'utf8'});
}

export class CardCompiler {
  constructor(
      private entry: EntryInfo,
      private categoryData: { [name: string]: ItemCategoryInfo },
      private listIndex: { [name: string]: ListIndexRecord },
      private cardIndex: CardIndex
  ) {
  }

  async compileItem(name: string) {
    let item = await this.buildCombinedItem(name);
    return fs.promises.writeFile(`${this.entry.out}/json/combined/${normalizeFileName(name)}.json`, JSON.stringify(item, null, 2), {encoding: 'utf8'});
  }

  async buildCombinedItem(name: string): Promise<Item> {
    let sources: Item[] = [];
    let listRecord = this.listIndex[name];
    if (listRecord)
      sources.push(...await this.loadListSources(listRecord));
    let multiCardName = this.cardIndex.multiCardRefs[name];
    if (multiCardName) {
      let multiCardData = await this.loadCardSources(this.cardIndex.cards[multiCardName]);
      // TODO instead of completely deleting multi-data detect which value corresponds to the current item
      this.cleanOverlappingData(multiCardData, sources);
      multiCardData.forEach(item => item.meta.ignorablePlatforms = true);
      sources.push(...multiCardData);
    } else {
      let cardRecord = this.cardIndex.cards[name];
      if (cardRecord) {
        if (cardRecord.groupName) {
          let groupRecord = this.cardIndex.cards[cardRecord.groupName];
          if (groupRecord) {
            let groupSources = await this.loadCardSources(groupRecord);
            this.cleanOverlappingData(groupSources, sources);
            groupSources.forEach(item => item.meta.ignorablePlatforms = true);
            sources.push(...groupSources);
          }
        }
        this.cleanOverlappingData([], sources, true);
        sources.push(...await this.loadCardSources(cardRecord));
      }
    }
    let result = this.compileFromSources(name, sources) as Item;
    let categoryInfo = this.categoryData[name];
    if (categoryInfo)
      result.meta.categories = categoryInfo.categories;
    return result;
  }

  private cleanOverlappingData(commonData: Item[], sources: Item[], removePage = false) {
    commonData.forEach(item => {
      delete item.card.id;
      delete item.card.image;
      removePage ||= !!item.meta.page;
    });
    if (removePage) {
      sources.forEach(item => {
        delete (item.meta as any).page;
      });
    }
  }

  compileFromSources(name: string, sources: Item[]): Item {
    let platforms = sources[0].meta.platforms.sort();
    let card = {} as PlatformVarying<ItemCard>;
    let result: Item = {
      name,
      meta: {
        platforms,
        sources: [],
        exceptions: {}
      },
      card
    };
    for (let source of sources) {
      if (!source.meta.ignorablePlatforms) {
        let otherPlatforms = source.meta.platforms.sort();
        if (platforms.length !== otherPlatforms.length || platforms.some((x, i) => x !== otherPlatforms[i])) {
          addException(result.meta, 'platform mismatch');
          platforms = [...new Set([...platforms, ...otherPlatforms]).keys()];
        }
      }
      combineCards(card, source.card, result.meta);
      // TODO properly merge meta properties
      Object.assign(result.meta.exceptions!, source.meta.exceptions || {});
      result.meta.sources.push(...source.meta.sources);
    }
    if (Object.keys(result.meta.exceptions!).length === 0)
      delete result.meta.exceptions;
    return result;
  }

  private async loadListSources(listRecord: ListIndexRecord): Promise<Item[]> {
    return Promise.all(listRecord.sources.map(source => this.loadItemFromList(source)));
  }

  private async loadItemFromList(source: ListSource): Promise<Item> {
    let listPageContents: ParsedSection[] = JSON.parse(await fs.promises.readFile(`${this.entry.out}/json/lists/${source.fileName}.json`, {encoding: 'utf8'}));
    return listPageContents[source.sectionIndex].items[source.itemIndex];
  }

  private async loadCardSources(cardRecord: CardRecord): Promise<Item[]> {
    let result: Item[] = await Promise.all(cardRecord.files.map(location => this.loadItemFromPage(location)));
    result.forEach((item, i) => {
      item.meta.pageTitle = cardRecord.files[i].pageTitle;
    })
    return result;
  }

  private async loadItemFromPage(source: CardLocation): Promise<Item> {
    let cardPageContents: Item[] = JSON.parse(await fs.promises.readFile(`${this.entry.out}/json/pages/${source.fileName}.json`, {encoding: 'utf8'}));
    return cardPageContents[source.index];
  }

}