import * as JSDOM from 'jsdom';
import {fetchHtmlRaw} from './fetch';

function map<T, U>(array: ArrayLike<T>, callback: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
  return Array.prototype.map.call(array, callback, thisArg) as U[];
}

export async function getWeaponList(): Promise<string[]> {
  let rootText = await fetchHtmlRaw('https://terraria.wiki.gg/wiki/List_of_weapons');
  let rootDoc: Document = (new JSDOM.JSDOM(rootText)).window.document;
  const table: HTMLTableElement = rootDoc.querySelector('table.terraria.list-of-all-weapons')! as HTMLTableElement;
  return map(table.tBodies[0].rows, row => row.cells[1].textContent!);
}
