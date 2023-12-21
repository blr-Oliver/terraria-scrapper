import {makeVarying, PlatformList, PlatformName, PlatformVarying, PlatformVaryingValue, transform} from '../platform-varying';
import {ParsingException} from './common';
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

export interface WeaponInfo {
  id: number | number[];
  name: string;
  image: string | string[],
  damage: number;
  damageType: string;
  knockback: number;
  critChance: number;
  useTime: number;
  rarity: number;
  autoSwing: boolean;
  buyValue: number;
  sellValue: number;
  manaCost?: number;
  velocity?: number;
  ammo?: string;
  projectiles?: ProjectileInfo[];
  reach?: number;
  spinDuration?: number;
  tooltip?: string;
  consumable?: boolean;
  toolSpeed?: number;
  maxStack?: number;
  pickaxePower?: number;
  hammerPower?: number;
  axePower?: number;
  bonus?: number;
}

export interface ProjectileInfo {
  id: number;
  name: string;
  image: string;
}

export interface MetaInfo {
  platforms: PlatformList;
  parsingExceptions: CardParsingException[];
}

export interface CardParsingException extends ParsingException {
  stage: string;
  value?: any;
}

export type ScrappedWeapon = PlatformVarying<WeaponInfo> & { meta?: MetaInfo };

export function parseItemFromCard(card: Element, meta: MetaInfo): PlatformVarying<WeaponInfo> {
  const result: ScrappedWeapon = {} as ScrappedWeapon;
  result.name = extractVaryingString(card.querySelector('.title')!, meta.platforms);
  let namePlatforms = Object.keys(result.name);
  if (!isSameArray(namePlatforms, meta.platforms))
    meta.platforms = namePlatforms as PlatformList;

  card.querySelectorAll('.section')
      .forEach(section => processSection(section, result, meta));

  return result;
}

function isSameArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  let a_ = a.slice().sort();
  let b_ = b.slice().sort();
  return a_.every((x, i) => x === b_[i]);
}

function processSection(section: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  if (section.matches('.images')) processImagesSection(section, weapon, meta);
  else if (section.matches('.projectile')) processProjectileSection(section, weapon, meta);
  else if (section.matches('.ids')) processIdsSection(section, weapon, meta);
  else if (section.matches('.statistics')) processStatisticsSection(section, weapon, meta);
  else {
    meta.parsingExceptions.push({
      stage: 'categorize section',
      message: 'unknown section selector',
      value: section.className
    });
  }
}

function processImagesSection(section: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  let imageList = section.querySelector('ul.infobox-inline, ul.infobox-block')!;
  let images = imageList.querySelectorAll('img[src]');
  let sources = [...images].map(image => image.getAttribute('src')!);
  weapon.image = makeVarying(sources.length > 1 ? sources : sources[0], meta.platforms);
  weapon.autoSwing = makeVarying(!!section.querySelector('.auto'), meta.platforms);
  let stack = section.querySelector('.stack[title]');
  if (stack)
    weapon.maxStack = makeVarying(+stack.getAttribute('title')!.slice(11)); // 'Max stack: '
}

function processProjectileSection(section: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  let projectileList = section.querySelector('ul.infobox-inline')!;
  weapon.projectiles = weapon.projectiles || [];
  projectileList.querySelectorAll('li').forEach(li => {
    const name = li.querySelector('.name')!.textContent!.trim();
    const image = li.querySelector('.image img[src]')!.getAttribute('src')!;
    weapon.projectiles!.push({
      id: {},
      name: makeVarying(name, meta.platforms),
      image: makeVarying(image, meta.platforms)
    } as PlatformVarying<ProjectileInfo>);
  });
}

type IdInfo = {
  category: string,
  values: PlatformVaryingValue<number[]>
}

function parseIds(section: Element, meta: MetaInfo): IdInfo[] {
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
        meta.platforms
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

function processIdsSection(section: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  let ids = parseIds(section, meta);
  for (let info of ids) {
    switch (info.category.toLowerCase()) {
      case 'item id':
        weapon.id = transform(info.values, list => list.length > 1 ? list : list[0]);
        break;
      case 'projectile id':
        const knownProjectiles = weapon.projectiles!;
        const projectileIds = info.values;
        for (let key in projectileIds) {
          const platform = key as PlatformName;
          let ids: number[] = projectileIds[platform]!;
          for (let i = 0; i < ids.length && i < knownProjectiles.length; ++i) {
            knownProjectiles[i].id[platform] = ids[i];
          }
        }
        break;
        // TODO maybe add buff ids
      default:
        meta.parsingExceptions.push({
          stage: 'ids section',
          message: 'unknown id category',
          value: info.category
        });
    }
  }
}

function processStatisticsSection(section: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  let titleDiv = section.querySelector('.title');
  if (titleDiv) {
    let title = titleDiv!.textContent!.trim().toLowerCase();
    switch (title) {
      case 'statistics':
        processGeneralStatistics(section, weapon, meta);
        break;
      case 'sounds':
        // TODO add sounds processing
        break;
      default:
        meta.parsingExceptions.push({
          stage: 'statistics categorization',
          message: 'unknown title',
          value: title
        });
    }
  } else {
    meta.parsingExceptions.push({
      stage: 'statistics categorization',
      message: 'missing title'
    });
  }
}

function processGeneralStatistics(section: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  let toolPower = section.querySelector('ul.toolpower');
  if (toolPower) {
    processToolPower(toolPower, weapon, meta);
  }
  let table = section.querySelector('table.stat');
  if (table) {
    let lines = (table as HTMLTableElement).rows;
    [...lines].forEach(row => processProperty(row.cells[0].textContent!, row.cells[1], weapon, meta));
  } else {
    // TODO this is probably tool power stats
    meta.parsingExceptions.push({
      stage: 'statistics',
      message: 'table not found'
    });
  }
}

function processToolPower(list: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  let items = list.querySelectorAll('li:not(.zero)');
  for (let li of items) {
    let type: 'pickaxePower' | 'hammerPower' | 'axePower';
    if (li.matches('.pickaxe')) type = 'pickaxePower';
    else if (li.matches('.hammer')) type = 'hammerPower';
    else if (li.matches('.axe')) type = 'axePower';
    else {
      meta.parsingExceptions.push({
        stage: 'parsing tool power',
        message: 'unknown tool type',
        value: li.className
      });
      continue;
    }
    let platformMarker = li.querySelector('.eico');
    weapon[type!] = extractVaryingPercent(platformMarker ? platformMarker.parentElement! : li, meta.platforms);
  }
}

function processProperty(name: string, td: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  name = name.toLowerCase();
  const key = PROPERTIES_BY_NAME[name];
  switch (key) {
    case 'ammo':
      weapon.ammo = makeVarying(td.textContent!, meta.platforms);
      break;
    case 'damage':
      weapon.damage = extractVaryingInteger(td, meta.platforms);
      let typeMarker = td.querySelector('.small-bold:last-child');
      if (typeMarker)
        weapon.damageType = makeVarying(typeMarker.textContent!.trim().slice(1, -1).trim().toLowerCase(), meta.platforms);
      break;
    case 'knockback':
      weapon.knockback = extractVaryingDecimal(td, meta.platforms);
      break;
    case 'bonus':
      weapon.bonus = extractVaryingInteger(td, meta.platforms);
      break;
    case 'consumable':
      weapon.consumable = parseFlag(td, meta.platforms);
      break;
    case 'critChance':
      weapon.critChance = extractVaryingPercent(td, meta.platforms);
      break;
    case 'manaCost':
      weapon.manaCost = extractVaryingInteger(td, meta.platforms);
      break;
    case 'useTime':
      weapon.useTime = extractVaryingInteger(td, meta.platforms);
      break;
    case 'toolSpeed':
      weapon.toolSpeed = extractVaryingInteger(td, meta.platforms);
      break;
    case 'velocity':
      weapon.velocity = extractVaryingDecimal(td, meta.platforms);
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
        weapon.tooltip = makeVarying(chunks.join('').trim(), meta.platforms);
      } else
        weapon.tooltip = makeVarying(td.textContent!.trim(), meta.platforms);
      break;
    case 'maxStack':
      weapon.maxStack = extractVaryingInteger(td, meta.platforms);
      break;
    case 'rarity':
      let wrapper = td.querySelector('.rarity')!;
      let sortKey = wrapper.querySelector('s.sortkey');
      if (sortKey) {
        weapon.rarity = makeVarying(parseInt(sortKey.textContent!.trim()), meta.platforms);
      } else {
        let image = wrapper.querySelector('a img[alt]')!;
        let altString = image.getAttribute('alt')!.trim();
        let match = altString.match('/Rarity level:\s?(\d+)/i');
        weapon.rarity = makeVarying(+match![1], meta.platforms);
      }
      break;
    case 'buyValue':
      weapon.buyValue = extractVaryingCoinValue(td, meta.platforms);
      break;
    case 'sellValue':
      weapon.sellValue = extractVaryingCoinValue(td, meta.platforms);
      break;
    case 'ignore_':
      break;
    default:
      meta.parsingExceptions.push({
        stage: 'property detection',
        message: 'unknown property',
        value: name
      });
  }
}
