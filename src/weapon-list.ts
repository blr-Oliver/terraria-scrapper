import * as JSDOM from 'jsdom';
import {fetchHtmlRaw} from './fetch';

// function map<T, U>(array: ArrayLike<T>, callback: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
//   return Array.prototype.map.call(array, callback, thisArg) as U[];
// }

type WeaponInfo = any;

export async function getWeaponList(): Promise<WeaponInfo> {
  let rootText = await fetchHtmlRaw('https://terraria.wiki.gg/wiki/List_of_weapons');
  let rootDoc: Document = (new JSDOM.JSDOM(rootText)).window.document;
  const table: HTMLTableElement = rootDoc.querySelector('table.terraria.list-of-all-weapons')! as HTMLTableElement;
  return [...table.tBodies[0].rows].slice(1).map(extractWeaponInfo);
}

function extractWeaponInfo(row: HTMLTableRowElement): WeaponInfo {
  return {
    image: extractImage(row.cells[0]),
    name: extractName(row.cells[1]),
    damage: row.cells[2].textContent!.trim(),
    damageType: row.cells[3].textContent!.trim(),
    knockback: row.cells[4].textContent!.trim(),
    criticalChance: row.cells[5].textContent!.trim(),
    useTime: row.cells[6].textContent!.trim(),
    rarity: row.cells[7].textContent!.trim(),
    autoSwing: row.cells[8].querySelector('span')!.matches('t-yes'),
    hardMode: row.cells[9].querySelector('span')!.matches('t-yes'),
    coinValue: extractCoinValue(row.cells[10])
  };
}

function extractImage(td: HTMLTableCellElement) {
  let img = td.querySelector('img[src]')! as HTMLImageElement;
  return {
    src: img.src,
    width: img.width,
    height: img.height
  };
}

function extractName(td: HTMLTableCellElement) {
  let a = td.querySelector('a')! as HTMLAnchorElement;
  return {
    name: a.textContent!.trim(),
    href: a.href
  };
}

function extractCoinValue(td: HTMLTableCellElement) {
  return [...td.querySelectorAll('span.coin')].map(span => +span.getAttribute('data-sort-value')!)
}