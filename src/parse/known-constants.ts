import {ItemCard} from '../common/types';
import {COMMON_PARSER_TYPES} from './common-parsers';

export type StringMapping = { [text: string]: string };
export type StringSet = { [text: string]: true };

export const IGNORED_HEADERS: StringSet = {
  'availability': true,
  'maxblock': true,
  'max block': true,
  'notes': true,
  'source': true,
  'withammo': true,
  'with ammo': true
}

export const COMMON_PROPERTY_HEADERS: { [text: string]: keyof ItemCard } = {
  'ammotype': 'ammoType',
  'ammo type': 'ammoType',
  'axepower': 'axePower',
  'axe power': 'axePower',
  'base': 'damage',
  'bonus': 'rangeBonus',
  'crit': 'critChance',
  'criticalchance': 'critChance',
  'critical chance': 'critChance',
  'damage': 'damage',
  'damagetype': 'damageType',
  'damage type': 'damageType',
  'duration': 'spinDuration',
  'duration(seconds)': 'spinDuration',
  'duration (seconds)': 'spinDuration',
  'hm': 'hardMode',
  'hmonly': 'hardMode',
  'hm only': 'hardMode',
  'hammerpower': 'hammerPower',
  'hammer power': 'hammerPower',
  'image': 'image',
  'knockback': 'knockback',
  'mana': 'manaCost',
  'miningspeed': 'toolSpeed',
  'mining speed': 'toolSpeed',
  'multihitpenalty': 'multiHitPenalty',
  'multihit penalty': 'multiHitPenalty',
  'onedrop': 'isOneDropLogo',
  'one drop': 'isOneDropLogo',
  'pickaxepower': 'pickaxePower',
  'pickaxe power': 'pickaxePower',
  'radius': 'radius',
  'range': 'range',
  'range(tiles)': 'range',
  'range (tiles)': 'range',
  'rarity': 'rarity',
  'reach': 'reach',
  'reach(tiles)': 'reach',
  'reach (tiles)': 'reach',
  'sell': 'sellValue',
  'sellvalue': 'sellValue',
  'sell value': 'sellValue',
  'type': 'summonType',
  'usetime': 'useTime',
  'use time': 'useTime',
  'value': 'sellValue',
  'velocity': 'velocity'
};

// find those keys of COMMON_PARSER_TYPES which have mapping to corresponding property type of ItemCard
export type PropertyParserTypes<K extends keyof ItemCard> = keyof {
  [T in keyof COMMON_PARSER_TYPES as COMMON_PARSER_TYPES[T] extends ItemCard[K] ? T : never]: ItemCard[K];
};

export type PropertyToParserMapping = {
  [K in keyof ItemCard]?: PropertyParserTypes<K>;
}
export const COMMON_PROPERTY_TYPES: PropertyToParserMapping = {
  'ammoType': 'string',
  'autoSwing': 'flag',
  'axePower': 'percent',
  'rangeBonus': 'integer',
  'critChance': 'percent',
  'damage': 'integer',
  'damageType': 'string',
  'spinDuration': 'number', // infinity reflected as -1
  'hardMode': 'flag',
  'hammerPower': 'percent',
  'image': 'image',
  'knockback': 'decimal',
  'manaCost': 'integer',
  'toolSpeed': 'integer',
  'multiHitPenalty': 'percent',
  'isOneDropLogo': 'flag',
  'pickaxePower': 'percent',
  'radius': 'decimal',
  'range': 'integer',
  'rarity': 'sortable',
  'reach': 'decimal',
  'sellValue': 'sortable',
  'summonType': 'string',
  'useTime': 'integer',
  'velocity': 'decimal'
}

export const PROPERTIES_BY_NAME: StringMapping = {
  'type': 'tags',
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
  'ammo': 'ammoType',
  'uses ammo': 'ammoType',
  'bonus': 'rangeBonus',
  'research': 'ignore_',
  'placeable': 'ignore_'
};