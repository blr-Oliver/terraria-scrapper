import {getClosestSectionHeader} from '../common';
import {MODIFIER_PROPERTIES} from '../known-constants';

export type PrefixType = 'weapon' | 'accessory';

export interface Prefix {
  id: number;
  name: string;
  type: PrefixType;
  tier: -2 | -1 | 0 | 1 | 2;
  value: number;
}

export interface WeaponPrefix extends Prefix {
  type: 'weapon';
  group: string;
  damage?: number;
  speed?: number;
  critChance?: number;
  manaCost?: number;
  size?: number;
  velocity?: number;
  knockback?: number;
}

export type AccessoryEffect = 'defense' | 'critChance' | 'damage' | 'moveSpeed' | 'meleeSpeed' | 'mana';

export interface AccessoryPrefix extends Prefix {
  type: 'accessory';
  effect: AccessoryEffect;
  value: 1 | 2 | 3 | 4 | 20;
}

export function parsePrefixListsFromDocument(document: Document): Prefix[][] {
  let tables = [...document.querySelectorAll('table.terraria.lined.sortable')].slice(0, 6) as HTMLTableElement[];
  return [
    parseAccessoryPrefixes(tables[0]),
    ...tables.slice(1, 6).map(table => parseWeaponPrefixes(table))
  ];
}

function parseAccessoryPrefixes(table: HTMLTableElement): AccessoryPrefix[] {
  const tableHeader = [...table.rows[0].cells].slice(-4)
      .map(cell => cell.textContent!.trim().toLowerCase());
  const rows = [...table.rows].slice(1);
  const rowGroups = rows.reduce((sections, row) => (row.cells.length === 5 ? sections.push([row]) : sections.at(-1)!.push(row), sections), [] as HTMLTableRowElement[][]);
  let result: AccessoryPrefix[] = [];
  for (let rowGroup of rowGroups) {
    let groupText = rowGroup[0].cells[0].textContent!.trim().toLowerCase();
    let effect = (MODIFIER_PROPERTIES[groupText] || groupText) as AccessoryEffect;
    for (let row of rowGroup) {
      let prefix = parseSinglePrefix([...row.cells].slice(-4), tableHeader) as AccessoryPrefix;
      prefix.type = 'accessory';
      prefix.effect = effect;
      result.push(prefix);
    }
  }
  return result;
}

function parseWeaponPrefixes(table: HTMLTableElement): WeaponPrefix[] {
  const sectionHeader = getClosestSectionHeader(table)!;
  const group = sectionHeader.textContent!.trim().toLowerCase().split(' ')[0];
  const tableHeader = [...table.rows[0].cells].map(cell => cell.textContent!.trim().toLowerCase());
  return [...table.rows].slice(1)
      .map(row => parseSinglePrefix(row.cells, tableHeader) as WeaponPrefix)
      .map(prefix => ({
        ...prefix,
        group,
        type: 'weapon'
      }));
}

function parseSinglePrefix(cells: ArrayLike<HTMLTableCellElement>, tableHeader: string[]): Prefix {
  let result = {} as Prefix;
  for (let i = 0; i < tableHeader.length; ++i) {
    const columnHeader = tableHeader[i];
    const property = MODIFIER_PROPERTIES[columnHeader] || columnHeader;
    if (property === 'name') {
      result.name = cells[i].textContent!;
    } else {
      const value = parseFloat(cells[i].textContent!);
      if (value) {
        (result as any)[property] = value;
      }
    }
  }
  return result;
}