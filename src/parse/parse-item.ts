import {ItemCard, ProjectileInfo, ScrappedItem} from '../common/types';
import {makeVarying, PlatformList, PlatformName, PlatformVarying, PlatformVaryingValue, transform} from '../platform-varying';
import {parseFlag} from './common-parsers';
import {
  extractPlatformsFromClasses,
  extractVaryingCoinValue,
  extractVaryingDecimal,
  extractVaryingInteger,
  extractVaryingPercent,
  extractVaryingString,
  extractVaryingValue,
  flagsNodeMatcher,
  Node,
  selectorMatcher
} from './extract-varying';
import {PROPERTIES_BY_NAME} from './known-constants';

export interface MetaInfo {
  platforms: PlatformList;
  parsingExceptions: CardParsingException[];
}

export interface CardParsingException {
  stage: string;
  value?: any;
  message?: string;
}

export function parseItemFromCard(card: Element, platforms: PlatformList): ScrappedItem {
  const name = extractVaryingString(card.querySelector('.title')!, platforms);
  let namePlatforms = Object.keys(name);
  if (!isSameArray(namePlatforms, platforms))
    platforms = namePlatforms as PlatformList;

  const result: ScrappedItem = {
    name: name[platforms[0]]!,
    platforms,
    item: {
      name
    } as PlatformVarying<ItemCard>,
    exceptions: []
  };

  card.querySelectorAll('.section')
      .forEach(section => processSection(section, result));

  return result;
}

function isSameArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  let a_ = a.slice().sort();
  let b_ = b.slice().sort();
  return a_.every((x, i) => x === b_[i]);
}

function processSection(section: Element, context: ScrappedItem) {
  if (section.matches('.images')) processImagesSection(section, context);
  else if (section.matches('.projectile')) processProjectileSection(section, context);
  else if (section.matches('.ids')) processIdsSection(section, context);
  else if (section.matches('.statistics')) processStatisticsSection(section, context);
  else {
    context.exceptions.push({
      stage: 'categorize section',
      message: 'unknown section selector',
      value: section.className
    });
  }
}

function processImagesSection(section: Element, context: ScrappedItem) {
  let imageList = section.querySelector('ul.infobox-inline, ul.infobox-block')!;
  let images = imageList.querySelectorAll('img[src]');
  let sources = [...images].map(image => image.getAttribute('src')!);
  context.item.image = makeVarying(sources, context.platforms);
  context.item.autoSwing = makeVarying(!!section.querySelector('.auto'), context.platforms);
  let stack = section.querySelector('.stack[title]');
  if (stack)
    context.item.maxStack = makeVarying(+stack.getAttribute('title')!.slice(11), context.platforms); // 'Max stack: '
}

function processProjectileSection(section: Element, context: ScrappedItem) {
  let projectileList = section.querySelector('ul.infobox-inline')!;
  const projectiles: ProjectileInfo[] = [];
  projectileList.querySelectorAll('li').forEach(li => {
    const name = li.querySelector('.name')!.textContent!.trim();
    const image = li.querySelector('.image img[src]')!.getAttribute('src')!;
    projectiles.push({id: 0, name, image});
  });
  context.item.projectiles = makeVarying(projectiles); // TODO merge with existing
}

type IdInfo = {
  category: string,
  values: PlatformVaryingValue<number[]>
}

function parseIds(section: Element, platforms: PlatformList): IdInfo[] {
  let ids: IdInfo[] = [];
  section.querySelectorAll('ul>li').forEach(idBlock => {
    const category = idBlock.querySelector('a')!.textContent!;
    const contentMerger: (a: string | null, b: string) => string =
        (a, b) => a ? [a, b].join(',') : b;
    let contentExtractor = (node: Node) =>
        [...node.childNodes]
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.nodeValue!)
            .join('');
    const extractedIds = extractVaryingValue<string, number[]>(
        idBlock,
        selectorMatcher('b', idBlock),
        flagsNodeMatcher,
        contentExtractor,
        node => extractPlatformsFromClasses(node as Element),
        contentMerger,
        parseIdList,
        platforms
    );
    ids.push({
      category,
      values: extractedIds
    });
  });
  return ids;
}

function parseIdList(x: string): number[] {
  return x.split(',')
      .map(g => g.trim())
      .map(g => g.split(/\s*[-\u{2013}\u{2014}]\s*/gu)) // also en dash and em dash
      .flatMap(g => allInInterval(g));
}

function allInInterval([start, end = start]: string[]): number[] {
  let s = +start, e = +end;
  return Array.from({length: e - s + 1}, (_, i) => s + i);
}

function processIdsSection(section: Element, context: ScrappedItem) {
  let ids = parseIds(section, context.platforms);
  const {item, exceptions} = context;
  for (let info of ids) {
    switch (info.category.toLowerCase()) {
      case 'item id':
        item.id = transform(info.values, list => list.length > 1 ? list : list[0]);
        break;
      case 'projectile id':
        const projectilePerPlatform = item.projectiles!;
        const projectileIds = info.values;
        for (let key in projectileIds) {
          const platform = key as PlatformName;
          const projectiles = projectilePerPlatform[platform];
          if (!projectiles) {
            exceptions.push({
              stage: 'projectile ids',
              message: 'missing platform',
              value: platform
            });
          } else {
            let ids: number[] = projectileIds[platform]!;
            if (projectiles.length !== ids.length) {
              exceptions.push({
                stage: 'projectile ids',
                message: 'unaligned length'
              });
            } else {
              for (let i = 0; i < ids.length && i < ids.length; ++i) {
                projectiles[i].id = ids[i];
              }
            }
          }
        }
        break;
        // TODO maybe add buff ids
      default:
        exceptions.push({
          stage: 'ids section',
          message: 'unknown id category',
          value: info.category
        });
    }
  }
}

function processStatisticsSection(section: Element, context: ScrappedItem) {
  let titleDiv = section.querySelector('.title');
  if (titleDiv) {
    let title = titleDiv!.textContent!.trim().toLowerCase();
    switch (title) {
      case 'statistics':
        processGeneralStatistics(section, context);
        break;
      case 'sounds':
        // TODO add sounds processing
        break;
      default:
        context.exceptions.push({
          stage: 'statistics categorization',
          message: 'unknown title',
          value: title
        });
    }
  } else {
    context.exceptions.push({
      stage: 'statistics categorization',
      message: 'missing title'
    });
  }
}

function processGeneralStatistics(section: Element, context: ScrappedItem) {
  let toolPower = section.querySelector('ul.toolpower');
  if (toolPower) {
    processToolPower(toolPower, context);
  }
  let table = section.querySelector('table.stat');
  if (table) {
    let lines = (table as HTMLTableElement).rows;
    [...lines].forEach(row => processProperty(row.cells[0].textContent!, row.cells[1], context));
  } else {
    // TODO this is probably tool power stats
    context.exceptions.push({
      stage: 'statistics',
      message: 'table not found'
    });
  }
}

function processToolPower(list: Element, context: ScrappedItem) {
  let items = list.querySelectorAll('li:not(.zero)');
  for (let li of items) {
    let type: 'pickaxePower' | 'hammerPower' | 'axePower';
    if (li.matches('.pickaxe')) type = 'pickaxePower';
    else if (li.matches('.hammer')) type = 'hammerPower';
    else if (li.matches('.axe')) type = 'axePower';
    else {
      context.exceptions.push({
        stage: 'parsing tool power',
        message: 'unknown tool type',
        value: li.className
      });
      continue;
    }
    let platformMarker = li.querySelector('.eico');
    context.item[type!] = extractVaryingPercent(platformMarker ? platformMarker.parentElement! : li, context.platforms);
  }
}

function processProperty(propertyName: string, td: Element, context: ScrappedItem) {
  propertyName = propertyName.toLowerCase();
  const key = PROPERTIES_BY_NAME[propertyName];
  const {item, platforms, exceptions} = context;
  switch (key) {
    case 'tags':
      const tagBlocks = td.querySelectorAll('.tags .tag');
      const tags = Array.prototype.map.call(tagBlocks, e => e.textContent!.trim()) as string[];
      item.tags = makeVarying(tags, platforms);
      break;
    case 'ammoType':
      item.ammoType = makeVarying(td.textContent!, platforms);
      break;
    case 'damage':
      item.damage = extractVaryingInteger(td, platforms);
      let typeMarker = td.querySelector('.small-bold:last-child');
      if (typeMarker)
        item.damageType = makeVarying(typeMarker.textContent!.trim().slice(1, -1).trim().toLowerCase(), platforms);
      break;
    case 'knockback':
      item.knockback = extractVaryingDecimal(td, platforms);
      break;
    case 'rangeBonus':
      item.rangeBonus = extractVaryingInteger(td, platforms);
      break;
    case 'consumable':
      item.consumable = parseFlag(td, platforms);
      break;
    case 'critChance':
      item.critChance = extractVaryingPercent(td, platforms);
      break;
    case 'manaCost':
      item.manaCost = extractVaryingInteger(td, platforms);
      break;
    case 'useTime':
      item.useTime = extractVaryingInteger(td, platforms);
      break;
    case 'toolSpeed':
      item.toolSpeed = extractVaryingInteger(td, platforms);
      break;
    case 'velocity':
      item.velocity = extractVaryingDecimal(td, platforms);
      break;
    case 'tooltip':
      let gameTextContainer = td.querySelector('.gameText');
      if (gameTextContainer) {
        let chunks: string[] = [];
        for (let child of [...gameTextContainer.childNodes]) {
          if (child.nodeType === Node.TEXT_NODE)
            chunks.push(child.nodeValue!);
          else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName.toLowerCase() === 'br')
            chunks.push('\n');
        }
        item.tooltip = makeVarying(chunks.join('').trim(), platforms);
      } else
        item.tooltip = makeVarying(td.textContent!.trim(), platforms);
      break;
    case 'maxStack':
      item.maxStack = extractVaryingInteger(td, platforms);
      break;
    case 'rarity':
      let wrapper = td.querySelector('.rarity')!;
      let sortKey = wrapper.querySelector('s.sortkey');
      if (sortKey) {
        item.rarity = makeVarying(parseInt(sortKey.textContent!.trim()), platforms);
      } else {
        let image = wrapper.querySelector('a img[alt]')!;
        let altString = image.getAttribute('alt')!.trim();
        let match = altString.match('/Rarity level:\s?(\d+)/i');
        item.rarity = makeVarying(+match![1], platforms);
      }
      break;
    case 'buyValue':
      item.buyValue = extractVaryingCoinValue(td, platforms);
      break;
    case 'sellValue':
      item.sellValue = extractVaryingCoinValue(td, platforms);
      break;
    case 'ignore_':
      break;
    default:
      exceptions.push({
        stage: 'property detection',
        message: 'unknown property',
        value: propertyName
      });
  }
}
