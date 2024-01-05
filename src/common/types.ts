import {PlatformList, PlatformVarying} from '../platform-varying';

export interface ItemInfo {
  id?: number | number[];
  name: string;
  page: string;
  pageTitle: string;
  image: string[],
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

export type ItemCard = ItemInfo & WeaponInfo & ExplosiveInfo & ToolInfo & YoyoInfo & WhipInfo;

export interface ProjectileInfo {
  id: number;
  name: string;
  image: string;
}

export interface ScrappedItem {
  name: string;
  pageTitle?: string;
  ignorablePlatforms?: boolean;
  platforms: PlatformList;
  item: PlatformVarying<ItemCard>;
  exceptions: any;
}

export interface ScrappedItemWithSource extends ScrappedItem {
  sources: (CardSource | ListSource)[];
}

export interface CardSource {
  type: 'card';
  filename: string;
  index: number;
}

export interface ListSource {
  type: 'list';
  filename: string;
  section?: string;
  sectionIndex: number;
  itemIndex: number;
}