import {Item, ItemMetaInfo, ProjectileInfo} from '../common/types';
import {addException} from '../common/utils';
import {makeVarying, PlatformList, PlatformName, PlatformVaryingValue, transform} from '../platform-varying';
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

export function parseItemFromCard(card: Element, platforms: PlatformList): Item {
  const name = extractVaryingString(card.querySelector('.title')!, platforms);
  let namePlatforms = Object.keys(name);
  if (!isSameArray(namePlatforms, platforms))
    platforms = namePlatforms as PlatformList;

  const result: Item = {
    name: name[platforms[0]]!,
    meta: {
      platforms
    } as ItemMetaInfo,
    card: {}
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

function processSection(section: Element, context: Item) {
  if (section.matches('.images')) processImagesSection(section, context);
  else if (section.matches('.projectile')) processProjectileSection(section, context);
  else if (section.matches('.ids')) processIdsSection(section, context);
  else if (section.matches('.statistics')) processStatisticsSection(section, context);
  else if (section.matches('.buff, .debuff')) {
    // TODO these are known but not yet implemented
  } else {
    addException(context.meta, 'categorize section', 'unknown section selector', section.className);
  }
}

function processImagesSection(section: Element, context: Item) {
  let imageList = section.querySelector('ul.infobox-inline, ul.infobox-block')!;
  let images = imageList.querySelectorAll('img[src]');
  let sources = [...images].map(image => image.getAttribute('src')!);
  context.card.image = makeVarying(sources, context.meta.platforms);
  context.card.autoSwing = makeVarying(!!section.querySelector('.auto'), context.meta.platforms);
  let stack = section.querySelector('.stack[title]');
  if (stack)
    context.card.maxStack = makeVarying(+stack.getAttribute('title')!.slice(11), context.meta.platforms); // 'Max stack: '
}

function processProjectileSection(section: Element, context: Item) {
  let projectileList = section.querySelector('ul.infobox-inline')!;
  const projectiles: ProjectileInfo[] = [];
  projectileList.querySelectorAll('li').forEach(li => {
    const name = li.querySelector('.name')!.textContent!.trim();
    const image = li.querySelector('.image img[src]')!.getAttribute('src')!;
    projectiles.push({id: 0, name, image});
  });
  context.card.projectiles = makeVarying(projectiles); // TODO merge with existing
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

function processIdsSection(section: Element, context: Item) {
  let ids = parseIds(section, context.meta.platforms);
  const card = context.card;
  for (let info of ids) {
    switch (info.category.toLowerCase()) {
      case 'item id':
        card.id = transform(info.values, list => list.length > 1 ? list : list[0]);
        break;
      case 'projectile id':
        const projectilePerPlatform = card.projectiles!;
        const projectileIds = info.values;
        for (let key in projectileIds) {
          const platform = key as PlatformName;
          const projectiles = projectilePerPlatform[platform];
          if (!projectiles) {
            addException(context.meta, 'projectile ids', 'missing platform', platform);
          } else {
            let ids: number[] = projectileIds[platform]!;
            if (projectiles.length !== ids.length) {
              addException(context.meta, 'projectile ids', 'unaligned length');
            } else {
              for (let i = 0; i < ids.length && i < ids.length; ++i) {
                projectiles[i].id = ids[i];
              }
            }
          }
        }
        break;
      case 'buff id':
      case 'tile id':
        // TODO implement it
        break;
      default:
        addException(context.meta, 'ids section', 'unknown id category', info.category);
    }
  }
}

function processStatisticsSection(section: Element, context: Item) {
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
        addException(context.meta, 'statistics categorization', 'unknown title', title);
    }
  } else {
    addException(context.meta, 'statistics categorization', 'missing title');
  }
}

function processGeneralStatistics(section: Element, context: Item) {
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
    addException(context.meta, 'statistics', 'table not found');
  }
}

function processToolPower(list: Element, context: Item) {
  let items = list.querySelectorAll('li:not(.zero)');
  for (let li of items) {
    let type: 'pickaxePower' | 'hammerPower' | 'axePower';
    if (li.matches('.pickaxe')) type = 'pickaxePower';
    else if (li.matches('.hammer')) type = 'hammerPower';
    else if (li.matches('.axe')) type = 'axePower';
    else {
      addException(context.meta, 'parsing tool power', 'unknown tool type', li.className);
      continue;
    }
    let contentNode = li.querySelector('img ~ span')!;
    context.card[type!] = extractVaryingPercent(contentNode, context.meta.platforms);
  }
}

function processProperty(propertyName: string, td: Element, context: Item) {
  propertyName = propertyName.toLowerCase();
  const key = PROPERTIES_BY_NAME[propertyName];
  const card = context.card;
  const platforms = context.meta.platforms;
  switch (key) {
    case 'tags':
      const tagBlocks = td.querySelectorAll('.tags .tag');
      const tags = Array.prototype.map.call(tagBlocks, e => e.textContent!.trim()) as string[];
      card.tags = makeVarying(tags, platforms);
      break;
    case 'ammoType':
      card.ammoType = makeVarying(td.textContent!, platforms);
      break;
    case 'damage':
      card.damage = extractVaryingInteger(td, platforms);
      let typeMarker = td.querySelector('.small-bold:last-child');
      if (typeMarker)
        card.damageType = makeVarying(typeMarker.textContent!.trim().slice(1, -1).trim(), platforms);
      break;
    case 'knockback':
      card.knockback = extractVaryingDecimal(td, platforms);
      break;
    case 'rangeBonus':
      card.rangeBonus = extractVaryingInteger(td, platforms);
      break;
    case 'consumable':
      card.consumable = parseFlag(td, platforms);
      break;
    case 'critChance':
      card.critChance = extractVaryingPercent(td, platforms);
      break;
    case 'manaCost':
      card.manaCost = extractVaryingInteger(td, platforms);
      break;
    case 'useTime':
      card.useTime = extractVaryingInteger(td, platforms);
      break;
    case 'toolSpeed':
      card.toolSpeed = extractVaryingInteger(td, platforms);
      break;
    case 'velocity':
      card.velocity = extractVaryingDecimal(td, platforms);
      break;
    case 'baseVelocity':
      card.baseVelocity = extractVaryingDecimal(td, platforms);
      break;
    case 'velocityMultiplier':
      card.velocityMultiplier = extractVaryingDecimal(td, platforms);
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
        card.tooltip = makeVarying(chunks.join('').trim(), platforms);
      } else
        card.tooltip = makeVarying(td.textContent!.trim(), platforms);
      break;
    case 'maxStack':
      card.maxStack = extractVaryingInteger(td, platforms);
      break;
    case 'rarity':
      let wrapper = td.querySelector('.rarity')!;
      let sortKey = wrapper.querySelector('s.sortkey');
      if (sortKey) {
        card.rarity = makeVarying(parseInt(sortKey.textContent!.trim()), platforms);
      } else {
        let image = wrapper.querySelector('a img[alt]')!;
        let altString = image.getAttribute('alt')!.trim();
        let match = altString.match('/Rarity level:\s?(\d+)/i');
        card.rarity = makeVarying(+match![1], platforms);
      }
      break;
    case 'buyValue':
      card.buyValue = extractVaryingCoinValue(td, platforms);
      break;
    case 'sellValue':
      card.sellValue = extractVaryingCoinValue(td, platforms);
      break;
    case 'ignore_':
      break;
    default:
      addException(context.meta, 'property detection', 'unknown property', propertyName);
  }
}

