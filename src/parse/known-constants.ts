export type StringMapping = { [text: string]: string };
export type StringSet = { [text: string]: true };

export const IGNORED_HEADERS: StringSet = {
  'availability': true,
  'maxblock': true,
  'max block': true,
  'notes': true,
  'source': true
}
export const COMMON_PROPERTY_HEADERS: StringMapping = {
  'ammotype': 'ammoType',
  'ammo type': 'ammoType',
  'axepower': 'axePower',
  'axe power': 'axePower',
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
  'range': 'range',
  'range(tiles)': 'range',
  'range (tiles)': 'range',
  'reach': 'reach',
  'reach(tiles)': 'reach',
  'reach (tiles)': 'reach',
  'type': 'summonType',
  'usetime': 'useTime',
  'use time': 'useTime',
  'velocity': 'velocity'
};

export const COMMON_PROPERTY_TYPES: StringMapping = {
  'ammoType': 'string',
  'axePower': 'percent',
  'rangeBonus': 'integer',
  'critChance': 'percent',
  'damage': 'integer',
  'damageType': 'string',
  'spinDuration': 'number',
  'hardMode': 'flag',
  'hammerPower': 'percent',
  'knockback': 'decimal',
  'manaCost': 'integer',
  'toolSpeed': 'integer',
  'multiHitPenalty': 'percent',
  'isOneDropLogo': 'flag',
  'pickaxePower': 'percent',
  'range': 'integer',
  'reach': 'decimal',
  'summonType': 'string',
  'useTime': 'integer',
  'velocity': 'decimal'
}

export const SPECIAL_PROPERTY_HEADERS: StringMapping = {
  'image': 'image',
  'rarity': 'rarity',
  'sell': 'sellValue',
  'sellvalue': 'sellValue',
  'sell value': 'sellValue',
  'value': 'sellValue'
}

export const MULTI_PROPERTY_HEADERS: StringMapping = {
  'name': 'nameBlock',
  'item': 'nameBlock'
}