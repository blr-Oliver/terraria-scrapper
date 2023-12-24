import {PlatformList, PlatformVarying} from '../platform-varying';

export interface Item {
  id?: number;
  name?: string;
}

export interface MultiSourceItem extends Item {
  source: ItemSourceInfo[];
}

export type ItemSourceInfo = {
  file: string;
  section: string;
}

export interface ItemInfo {
  id?: number | number[];
  name: string;
  page: string;
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
}

export type ItemCard = ItemInfo & WeaponInfo & ToolInfo & YoyoInfo & WhipInfo;

export interface ProjectileInfo {
  id: number;
  name: string;
  image: string;
}

export interface ScrappedItem {
  name: string;
  platforms: PlatformList;
  item: PlatformVarying<ItemCard>;
  exceptions: any[];
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