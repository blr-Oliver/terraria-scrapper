import * as fs from 'fs';
import {EntryInfo} from '../../execution';
import {ensureExists} from '../../fetch/common';
import {loadDocument} from '../common';
import {parsePrefixIdsFromDoc, PrefixIdInfo} from './parse-prefix-ids';
import {parsePrefixListsFromDocument, Prefix, WeaponPrefix} from './parse-prefix-lists';

export async function parsePrefixes(entry: EntryInfo): Promise<void> {
  await ensureExists(`${entry.out}/json`);
  let listDoc = await loadDocument(`${entry.out}/html/prefixes/list.html`);
  let prefixList = parsePrefixListsFromDocument(listDoc);
  let idsDoc = await loadDocument(`${entry.out}/html/prefixes/ids.html`);
  let prefixIds = parsePrefixIdsFromDoc(idsDoc);
  let result = populateIds(prefixList, prefixIds);
  return fs.promises.writeFile(`${entry.out}/json/prefixes.json`, JSON.stringify(result, null, 2), {encoding: 'utf8'});
}

function populateIds(groupedPrefixes: Prefix[][], prefixIds: PrefixIdInfo[]): Prefix[] {
  let idInfoByName = prefixIds.reduce((hash, info) => (hash[info.name] = info, hash), {} as { [name: string]: PrefixIdInfo });
  let result = groupedPrefixes
      .flatMap(group => group)
      .map(prefix => {
        let match = findIdMatch(prefix);
        if (match)
          prefix.id = match.id;
        return prefix;
      });
  result.push({
    id: 84,
    name: 'Legendary',
    type: 'weapon',
    tier: 2,
    value: 209.85,
    group: 'melee',
    damage: 17,
    critChance: 8,
    knockback: 17
  } as WeaponPrefix);
  return result;

  function findIdMatch(prefix: Prefix): PrefixIdInfo | undefined {
    switch (prefix.name) {
      case 'Legendary':
        return prefixIds.find(id => id.name === prefix.name && !id.note);
      case 'Deadly':
        return prefixIds.find(id => id.name === prefix.name && !id.note === ((prefix as WeaponPrefix).group !== 'ranged'));
      default:
        return idInfoByName[prefix.name];
    }
  }
}

