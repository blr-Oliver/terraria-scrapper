import {PlatformList, PlatformVarying} from '../platform-varying';

export interface Item {
  name: string;
  meta: ItemMetaInfo;
  card: PlatformVarying<ItemCard>;
}

export interface ItemMetaInfo {
  page?: string;
  pageTitle?: string;
  platforms: PlatformList;
  ignorablePlatforms?: boolean;
  categories?: string[];
  exceptions?: { [key: string]: any };
  sources: (ItemSource | CardSource | ListSource)[];
}

export type ItemCard = ItemInfo & WeaponInfo & ExplosiveInfo & ToolInfo & YoyoInfo & WhipInfo & AmmoInfo;

export interface ItemInfo {
  id?: number | number[];
  image?: string[],
  tags?: string[];
  tooltip?: string;
  consumable?: boolean;
  maxStack?: number;
  hardMode?: boolean;
}

export interface WeaponInfo {
  damage?: number;
  damageType?: string;
  knockback?: number;
  critChance?: number;
  useTime?: number;
  rarity?: number;
  autoSwing?: boolean;
  buyValue?: number;
  sellValue?: number;
  manaCost?: number;
  velocity?: number;
  projectiles?: ProjectileInfo[];
  ammoType?: string;
  summonType?: string;
  hitsPerSwing?: number;
  speedBonusMultiplier?: Ratio;
}

export type Ratio = {
  n: number;
  d: number;
}

export interface ProjectileInfo {
  id: number;
  name: string;
  image: string;
}

export interface AmmoInfo {
  baseVelocity?: number;
  velocityMultiplier?: number;
}

export interface ExplosiveInfo {
  radius?: number;
  explosivesDestroyTiles?: boolean;
  liquidRocketsWork?: boolean;
  clusterRocketSecondaryExplosion?: boolean;
  // TODO blast radius is actually (Tiny | Small | Large | Huge | Spread)
  blastRadius?: string;
  liquidRocketBlastRadius?: string;
  clusterRocketBlastRadius?: string;
  miniNukeBlastRadius?: string;
  bigRocketBlastRadius?: string;
}

export interface ToolInfo {
  pickaxePower?: number;
  hammerPower?: number;
  axePower?: number;
  toolSpeed?: number;
  rangeBonus?: number;
}

export interface YoyoInfo {
  reach?: number;
  spinDuration?: number;
  isOneDropLogo?: boolean;
}

export interface WhipInfo {
  multiHitPenalty?: number;
  range?: number;
  tagDamage?: number;
  tagCrit?: number;
}

export interface ItemSource {
  type: string;
  fileName: string;
}

export interface CardSource extends ItemSource {
  type: 'card';
  index: number;
}

export function isCardSource(x: any): x is CardSource {
  return x && typeof x === 'object'
      && x.type === 'card'
      && typeof x.index === 'number';
}

export interface ListSource extends ItemSource {
  type: 'list';
  section?: string;
  sectionIndex: number;
  itemIndex: number;
}

export function isListSource(x: any): x is ListSource {
  return x && typeof x === 'object'
      && x.type === 'list'
      && typeof x.sectionIndex === 'number'
      && typeof x.itemIndex === 'number'
      && (!('section' in x) || typeof x.section === 'string');
}
