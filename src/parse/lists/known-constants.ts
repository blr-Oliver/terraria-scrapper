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
export const COMMON_PROPERTY_HEADERS: StringMapping = {
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

export const COMMON_PROPERTY_TYPES: StringMapping = {
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

export const SPECIAL_PROPERTY_HEADERS: StringMapping = {
  'image': 'image'
}

export const MULTI_PROPERTY_HEADERS: StringMapping = {
  'name': 'nameBlock',
  'item': 'nameBlock'
}