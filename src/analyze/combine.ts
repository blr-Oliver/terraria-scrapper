import {ItemCard, ItemMetaInfo} from '../common/types';
import {addException, deepEqual} from '../common/utils';
import {PlatformList, PlatformVarying} from '../platform-varying';

const MERGING_PROPERTIES = {
  image: true,
  tags: true
}

export function combineCards(dest: PlatformVarying<ItemCard>, other: PlatformVarying<ItemCard>, meta: ItemMetaInfo) {
  let srcKeys = Object.keys(other) as (keyof ItemCard)[];
  for (let property of srcKeys) {
    if (property in dest) {
      let destMap = dest[property]!;
      let srcMap = other[property]!;
      let platforms = Object.keys(srcMap) as PlatformList;
      for (let platform of platforms) {
        if (platform in srcMap) {
          if (platform in destMap) {
            let srcValue = srcMap[platform]!;
            let destValue = destMap[platform]!;
            if (property in MERGING_PROPERTIES) {
              destMap[platform] = mergeLists(destValue as any[], srcValue as any[]);
            } else {
              if (!deepEqual(destValue, srcValue)) {
                addException(meta, 'merging', property, platform);
              }
              destMap[platform] = srcMap[platform];
            }
          } else {
            destMap[platform] = srcMap[platform];
          }
        }
      }
    } else {
      setProperty(property, dest, other);
    }
  }
}

function setProperty<K extends keyof ItemCard>(property: K, dest: PlatformVarying<ItemCard>, src: PlatformVarying<ItemCard>) {
  dest[property] = src[property];
}

function mergeLists<T>(a: T[], b: T[]): T[] {
  if (a.length < b.length) return mergeLists(b, a);
  let result: T[] = [];
  let aSet = new Set(a);
  let bOrder = new Map<T, number>();
  b.forEach((x, i) => bOrder.set(x, i));
  let ai = 0, bi = 0;
  while (ai < a.length) {
    let aItem = a[ai++];
    if (bOrder.has(aItem)) {
      let bIndex = bOrder.get(aItem)!;
      while (bi <= bIndex) {
        let bItem = b[bi++];
        if (bi !== bIndex && !aSet.has(bItem))
          result.push(bItem);
      }
    }
    result.push(aItem);
  }
  while (bi < b.length)
    result.push(b[bi++]);
  return result;
}
