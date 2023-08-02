import {JSDOM} from 'jsdom';
import {fetchHtmlRaw} from '../fetch/fetch';
import {ALL_PLATFORMS, makeVarying, PlatformList, PlatformName, PlatformVarying, PlatformVaryingValue, transform} from '../platform-varying';
import {
  extractPlatformsFromClasses,
  extractVaryingCoinValue,
  extractVaryingNumber,
  extractVaryingPercent,
  extractVaryingString,
  extractVaryingValue,
  Node,
  selectorMatcher
} from './extract-varying';

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
  bonus?: string;
}

export interface ProjectileInfo {
  id: number;
  name: string;
  image: string;
}

export interface MetaInfo {
  platforms: PlatformList;
  parsingExceptions: ParsingException[];
}

export interface ParsingException {
  stage: string;
  description: string;
  value?: any;
}

export type ScrappedWeapon = PlatformVarying<WeaponInfo> & { meta?: MetaInfo };

export async function getWeaponInfo(path: string): Promise<ScrappedWeapon> {
  const rootText = await fetchHtmlRaw('https://terraria.wiki.gg' + path);
  const rootDoc: Document = new JSDOM(rootText).window.document;

  const contentRoot = rootDoc.querySelector('.mw-parser-output')!;
  let messageBox = contentRoot.querySelector('.message-box.msgbox-color-blue');
  let platforms: PlatformName[] = messageBox ? extractPlatformsFromImages(messageBox) : ALL_PLATFORMS as PlatformName[];
  let meta: MetaInfo = {
    platforms,
    parsingExceptions: []
  }
  let weaponInfo = extractWeaponCard(contentRoot.querySelector('.infobox.item')!, meta);
  (weaponInfo as ScrappedWeapon).meta = meta;
  return weaponInfo as ScrappedWeapon;
}

export function extractWeaponCard(card: Element, meta: MetaInfo): PlatformVarying<WeaponInfo> {
  const result: ScrappedWeapon = {} as ScrappedWeapon;
  result.name = extractVaryingString(card.querySelector('.title')!, meta.platforms);

  card.querySelectorAll('.section')
      .forEach(section => processSection(section, result, meta));

  return result;
}

function processSection(section: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  if (section.matches('.images')) processImagesSection(section, weapon, meta);
  else if (section.matches('.projectile')) processProjectileSection(section, weapon, meta);
  else if (section.matches('.ids')) processIdsSection(section, weapon, meta);
  else if (section.matches('.statistics')) processStatisticsSection(section, weapon, meta);
  else {
    meta.parsingExceptions.push({
      stage: 'categorize section',
      description: 'unknown section selector',
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

function parseIds(section: Element, meta: MetaInfo) {
  let ids: IdInfo[] = [];
  section.querySelectorAll('ul>li').forEach(idBlock => {
    const category = idBlock.querySelector('a')!.textContent!;
    const contentMerger: (a: string | null, b: string) => string =
        (a, b) => a ? [a, b].join(',') : b;
    const contentFinalizer: (x: string) => number[] =
        x => x.split(',').map(id => +id.trim());
    let contentExtractor = (node: Node) =>
        [...node.childNodes]
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.nodeValue!)
            .join('');
    const extractedIds = extractVaryingValue<string, number[]>(
        idBlock,
        selectorMatcher('b', idBlock),
        selectorMatcher('.eico'),
        contentExtractor,
        node => extractPlatformsFromClasses(node as Element),
        contentMerger,
        contentFinalizer,
        meta.platforms
    );
    ids.push({
      category,
      values: extractedIds
    });
  });
  return ids;
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
          description: 'unknown id category',
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
          description: 'unknown title',
          value: title
        });
    }
  } else {
    meta.parsingExceptions.push({
      stage: 'statistics categorization',
      description: 'missing title'
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
      description: 'table not found'
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
        description: 'unknown tool type',
        value: li.className
      });
      continue;
    }
    let platformMarker = li.querySelector('.eico');
    weapon[type!] = extractVaryingPercent(platformMarker ? platformMarker.parentElement! : li, meta.platforms);
  }
}

const PROPERTIES_BY_NAME: { [key: string]: string } = {
  'damage': 'damage',
  'knockback': 'knockback',
  'consumable': 'consumable',
  'mana': 'manaCost',
  'use time': 'useTime',
  'tool speed': 'toolSpeed',
  'velocity': 'velocity',
  'rarity': 'rarity',
  'buy': 'buyValue',
  'sell': 'sellValue',
  'critical chance': 'critChance',
  'tooltip': 'tooltip',
  'max stack': 'maxStack',
  'ammo': 'ammo',
  'uses ammo': 'ammo',
  'bonus': 'bonus',
  'research': 'ignore_',
  'placeable': 'ignore_',
  'type': 'ignore_'
};

function processProperty(name: string, td: Element, weapon: ScrappedWeapon, meta: MetaInfo) {
  name = name.toLowerCase();
  const key = PROPERTIES_BY_NAME[name];
  switch (key) {
    case 'ammo':
      weapon.ammo = makeVarying(td.textContent!, meta.platforms);
      break;
    case 'damage':
      weapon.damage = extractVaryingNumber(td, meta.platforms);
      let typeMarker = td.querySelector('.small-bold:last-child');
      if (typeMarker)
        weapon.damageType = makeVarying(typeMarker.textContent!.trim().slice(1, -1).trim().toLowerCase(), meta.platforms);
      break;
    case 'knockback':
      weapon.knockback = extractVaryingNumber(td, meta.platforms);
      break;
    case 'bonus':
      weapon.bonus = extractVaryingString(td, meta.platforms);
      break;
    case 'consumable':
      weapon.consumable = makeVarying(!!td.querySelector('.t-yes'), meta.platforms);
      break;
    case 'critChance':
      weapon.critChance = extractVaryingPercent(td, meta.platforms);
      break;
    case 'manaCost':
      weapon.manaCost = extractVaryingNumber(td, meta.platforms);
      break;
    case 'useTime':
      weapon.useTime = extractVaryingNumber(td, meta.platforms);
      break;
    case 'toolSpeed':
      weapon.toolSpeed = extractVaryingNumber(td, meta.platforms);
      break;
    case 'velocity':
      weapon.velocity = extractVaryingNumber(td, meta.platforms);
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
      weapon.maxStack = extractVaryingNumber(td, meta.platforms);
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
        description: 'unknown property',
        value: name
      });
  }
}

const MESSAGE_BOX_KEYS: { [key: string]: PlatformName } = {
  'desktop': 'pc',
  'pc': 'pc',
  'console': 'console',
  'mobile': 'mobile',
  'nintendo 3ds': 'threeDS',
  'nintendo': 'threeDS',
  '3ds': 'threeDS',
  'old-gen console': 'oldGen',
  'old-gen': 'oldGen',
  'oldgen': 'oldGen'
}

function extractPlatformsFromImages(messageBox: Element): PlatformList {
  let result: PlatformList = [];
  let iconList = messageBox.querySelector('.icon');
  if (iconList) {
    let icons = iconList.querySelectorAll('a img[alt]');
    let platformHash: PlatformVaryingValue<boolean> = {};
    let foundPlatforms = [...icons]
        .map(icon => /([\w\-\s]+)\s+version/i.exec(icon.getAttribute('alt')!))
        .filter(match => !!match && !!match[1])
        .map(match => match![1]!.toLowerCase().trim())
        .map(key => MESSAGE_BOX_KEYS[key] || (key as PlatformName));
    for (let platform of foundPlatforms) {
      if (!platformHash[platform]) {
        result.push(platform);
        platformHash[platform] = true;
      }
    }
  }
  return result;
}
