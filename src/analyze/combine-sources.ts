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

export interface CombinedItem extends ScrappedItemWithSource {
  categories?: string[];
}

export async function combineSources(entry: EntryInfo): Promise<void> {
  const categoryData: { [name: string]: ItemCategoryInfo } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/category-info.json`, {encoding: 'utf8'}));
  const listIndex: { [name: string]: ListIndexRecord } = JSON.parse(await fs.promises.readFile(`${entry.out}/json/listIndex.json`, {encoding: 'utf8'}));
  const cardIndex: CardIndex = JSON.parse(await fs.promises.readFile(`${entry.out}/json/cardIndex.json`, {encoding: 'utf8'}));

  let cardCompiler = new CardCompiler(entry, categoryData, listIndex, cardIndex);

  const allNames = Object.keys([categoryData, listIndex, cardIndex]
      .flatMap(o => Object.keys(o))
      .reduce((hash, name) => (hash[name] = true, hash), {} as { [name: string]: true })
  ).sort();

  await ensureExists(`${entry.out}/json/combined`);
  await Promise.allSettled(allNames.map(name => cardCompiler.compileItem(name)));
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
    return fs.promises.writeFile(`${this.entry.out}/json/combined/${name}.json`, JSON.stringify(item, null, 2), {encoding: 'utf8'});
  }

  async buildCombinedItem(name: string): Promise<CombinedItem> {
    let sources: ScrappedItemWithSource[] = [];
    let listRecord = this.listIndex[name];
    if (listRecord)
      sources.push(...await this.loadListSources(listRecord));
    let multiCardName = this.cardIndex.multiCardRefs[name];
    if (multiCardName) {
      let multiCardData = await this.loadCardSources(this.cardIndex.cards[multiCardName]);
      // TODO instead of completely deleting multi-data detect which value corresponds to the current item
      this.cleanOverlappingData(multiCardData, sources);
      multiCardData.forEach(item => item.ignorablePlatforms = true);
      sources.push(...multiCardData);
    } else {
      let cardRecord = this.cardIndex.cards[name];
      if (cardRecord) {
        if (cardRecord.groupName) {
          let groupRecord = this.cardIndex.cards[cardRecord.groupName];
          if (groupRecord) {
            let groupSources = await this.loadCardSources(groupRecord);
            this.cleanOverlappingData(groupSources, sources);
            groupSources.forEach(item => item.ignorablePlatforms = true);
            sources.push(...groupSources);
          }
        }
        this.cleanOverlappingData([], sources, true);
        sources.push(...await this.loadCardSources(cardRecord));
      }
    }
    let result = this.compileFromSources(name, sources) as CombinedItem;
    let categoryInfo = this.categoryData[name];
    if (categoryInfo)
      result.categories = categoryInfo.categories;
    return result;
  }

  private cleanOverlappingData(commonData: ScrappedItemWithSource[], sources: ScrappedItemWithSource[], removePage = false) {
    commonData.forEach(item => {
      delete item.item.id;
      delete (item.item as any).name;
      delete (item.item as any).image;
      removePage ||= !!item.item.page;
    });
    if (removePage) {
      sources.forEach(item => {
        delete (item.item as any).page;
      });
    }
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
      if (!source.ignorablePlatforms) {
        let otherPlatforms = source.platforms.sort();
        if (platforms.length !== otherPlatforms.length || platforms.some((x, i) => x !== otherPlatforms[i])) {
          result.exceptions['platform mismatch'] = true;
          platforms = [...new Set([...platforms, ...otherPlatforms]).keys()];
        }
      }
      combineCards(card, source.item, result.exceptions);
      result.sources.push(...source.sources);
    }
    if (Object.keys(result.exceptions).length === 0)
      delete result.exceptions;
    return result;
  }

  private async loadListSources(listRecord: ListIndexRecord): Promise<ScrappedItemWithSource[]> {
    return Promise.all(listRecord.sources.map(source => this.loadItemFromList(source)));
  }

  private async loadItemFromList(source: ListSource): Promise<ScrappedItemWithSource> {
    let listPageContents: ParsedSection[] = JSON.parse(await fs.promises.readFile(`${this.entry.out}/json/lists/${source.filename}.json`, {encoding: 'utf8'}));
    return listPageContents[source.sectionIndex].items[source.itemIndex];
  }

  private async loadCardSources(cardRecord: CardRecord): Promise<ScrappedItemWithSource[]> {
    let result: ScrappedItemWithSource[] = await Promise.all(cardRecord.files.map(location => this.loadItemFromPage(location)));
    result.forEach((item, i) => {
      item.pageTitle = cardRecord.files[i].pageTitle;
    })
    return result;
  }

  private async loadItemFromPage(source: CardLocation): Promise<ScrappedItemWithSource> {
    let cardPageContents: ScrappedItemWithSource[] = JSON.parse(await fs.promises.readFile(`${this.entry.out}/json/pages/${source.fileName}.json`, {encoding: 'utf8'}));
    return cardPageContents[source.index];
  }

}