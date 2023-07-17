import {ALL_PLATFORMS, Platform, PlatformList, PlatformName, PlatformVarying, PlatformVaryingValue} from './platform-varying';

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

function platformAware() {
  let text = '';
  [...text.matchAll(/(?:\s*\/\s*)?(\d+)(?:\s*\(([^()]+)\))?/g)].map(groups => [+groups[1], groups[2]]);
}
export type ScrappedWeapon = PlatformVarying<WeaponInfo> & { platforms?: PlatformList };

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
    [...icons]
        .map(icon => /([\w\-\s]+)\s+version/i.exec(icon.getAttribute('alt')!))
        .filter(match => !!match && !!match[1])
        .map(match => match![1]!.toLowerCase().trim())
        .forEach(key => MESSAGE_BOX_KEYS[key] || (key as PlatformName));
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

function extractVaryingString(iconList: Element): PlatformVaryingValue<string> {
  const valueNodeMatcher: (node: Node) => boolean = node => node.parentNode === iconList && node.nodeType === Node.TEXT_NODE;
  const flagsNodeMatcher: (node: Node) => boolean = node => (node instanceof Element && node.matches('.eico'));
  const valueNodeExtractor: (node: Node) => string = node => node.nodeValue!;
  const flagsNodeExtractor: (node: Node) => PlatformList = node => extractPlatformsFromClasses(node as Element);
  const valueMerger: (a: string | null, b: string) => string = (a, b) => (a || '') + b;

  iconList.normalize();
  let flatNodes = flattenNodes(iconList, node => valueNodeMatcher(node) || flagsNodeMatcher(node));
  let result: PlatformVaryingValue<string> = {};
  let i = 0;
  while (i < flatNodes.length) {
    let value: string | null = null;
    while (i < flatNodes.length && valueNodeMatcher(flatNodes[i]))
      value = valueMerger(value, valueNodeExtractor(flatNodes[i++]));
    let flags: PlatformList = i < flatNodes.length ? flagsNodeExtractor(flatNodes[i++]) : ALL_PLATFORMS;
    for (let flag of flags)
      result[flag] = value!;
  }
  return result;
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