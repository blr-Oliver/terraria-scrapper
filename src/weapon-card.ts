import {JSDOM} from 'jsdom';
import {fetchHtmlRaw} from './fetch';
import {ALL_PLATFORMS, Platform, PlatformList, PlatformName, PlatformVarying, PlatformVaryingValue} from './platform-varying';

const Node = new JSDOM('').window.Node;

export interface WeaponInfo {
  id: number;
  name: string;
  image: string,
  damage: number;
  damageType: string;
  knockback: number;
  criticalChance: number;
  useTime: number;
  rarity: number;
  autoSwing: boolean;
  hardMode: boolean;
  coinValue: number;
  velocity?: number;
  projectiles?: ProjectileInfo[];
  reach?: number;
  spinDuration?: number;
}

export interface ProjectileInfo {
  id: number;
  name: string;
  image: string;
}

export type ScrappedWeapon = PlatformVarying<WeaponInfo> & { platforms?: PlatformList };

export async function getWeaponInfo(path: string): Promise<ScrappedWeapon> {
  const rootText = await fetchHtmlRaw('https://terraria.wiki.gg' + path);
  const rootDoc: Document = new JSDOM(rootText).window.document;

  const contentRoot = rootDoc.querySelector('.mw-parser-output')!;
  let weaponInfo = extractWeaponCard(contentRoot.querySelector('.infobox.item')!);

  let messageBox = contentRoot.querySelector('.message-box');
  if (messageBox)
    (weaponInfo as ScrappedWeapon).platforms = extractPlatformsFromImages(messageBox);
  return weaponInfo;
}

export function extractWeaponCard(card: Element): PlatformVarying<WeaponInfo> {
  const name: PlatformVaryingValue<string> = extractName(card.querySelector('.title')!);
  return {
    name
  } as PlatformVarying<WeaponInfo>;
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

function extractName(title: Element): PlatformVaryingValue<string> {
  return extractVaryingString(title);
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

function flattenNodes(elem: Element, filter: (node: Node) => boolean): Node[] {
  let result: Node[] = [];
  collectLeaves(elem, filter, result);
  return result;

  function collectLeaves(node: Node, filter: (node: Node) => boolean, collect: Node[]) {
    let childNodes = node.childNodes;
    if (filter(node))
      collect.push(node);
    else if (childNodes && childNodes.length)
      childNodes.forEach(node => collectLeaves(node, filter, collect));
  }
}
/**
 * @template I type of intermediate value from collapsing value nodes
 * @template T value type
 */
function extractVaryingValue<I, T>(src: Element,
                                   valueNodeMatcher: (node: Node) => boolean,
                                   flagsNodeMatcher: (node: Node) => boolean,
                                   valueNodeExtractor: (node: Node) => I,
                                   flagsNodeExtractor: (node: Node) => PlatformList,
                                   valueMerger: (a: (I | null), x: I) => I,
                                   valueFinalizer: (x: I) => T): PlatformVaryingValue<T> {
  src.normalize();
  let flatNodes = flattenNodes(src, node => valueNodeMatcher(node) || flagsNodeMatcher(node));
  let result: PlatformVaryingValue<T> = {};
  let i = 0;
  while (i < flatNodes.length) {
    let accum: I | null = null;
    while (i < flatNodes.length && valueNodeMatcher(flatNodes[i]))
      accum = valueMerger(accum, valueNodeExtractor(flatNodes[i++]));
    const value: T = valueFinalizer(accum!);
    let flags: PlatformList = i < flatNodes.length ? flagsNodeExtractor(flatNodes[i++]) : ALL_PLATFORMS as PlatformList;
    for (let flag of flags)
      result[flag] = value;
  }
  return result;
}

function extractVaryingString(src: Element): PlatformVaryingValue<string> {
  return extractVaryingValue<string, string>(src,
      node => node.parentNode === src && node.nodeType === Node.TEXT_NODE,
      node => (node.nodeType === Node.ELEMENT_NODE && (node as Element).matches('.eico')),
      node => node.nodeValue!,
      node => extractPlatformsFromClasses(node as Element),
      (a, b) => (a || '') + b,
      stripLeadingOrTrailingSlash
  );
}

function extractPlatformsFromClasses(iconList: Element): PlatformList {
  let result: PlatformList = [];
  iconList.classList.forEach(className => {
    let match = className.match(/i(\d+)/);
    if (match) {
      let idx = +match[1];
      if (idx && (idx in Platform))
        result.push(Platform[idx] as PlatformName);
    }
  });
  return result;
}

function stripLeadingOrTrailingSlash(value: string): string {
  let match = value.match(/\/?\s*(.*\S*)\s*\/?/);
  return match ? match[1] : value;
}