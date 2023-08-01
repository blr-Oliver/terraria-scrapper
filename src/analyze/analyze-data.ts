import * as fs from 'fs';
import {PlatformVaryingValue} from '../platform-varying';
import {MetaInfo, WeaponInfo} from '../parse/weapon-card';

export type SavedItem = PlatformVaryingValue<WeaponInfo> & Omit<MetaInfo, 'platforms'>;
export function findInAllCards(test: (item: SavedItem) => boolean): { [file: string]: SavedItem } {
  let files = fs.readdirSync('out/cards', {encoding: 'utf8'})
      .filter(file => file.endsWith('.json'))
  return findInCards(files, test);
}

export function findInCards(files: string[], test: (item: SavedItem) => boolean): { [file: string]: SavedItem } {
  let result: { [file: string]: SavedItem } = {};

  for (let file of files) {
    let content = fs.readFileSync(`out/cards/${file}`, {encoding: 'utf8'});
    let item = JSON.parse(content) as SavedItem;
    if (test(item))
      result[file.slice(0, -5)] = item;
  }
  return result;
}