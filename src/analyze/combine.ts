import {ItemCard, ItemMetaInfo} from '../common/types';
import {addException, deepEqual} from '../common/utils';
import {PlatformList, PlatformVarying} from '../platform-varying';
import {VaryingObject} from '../varying';

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
      setVaryingProperty(property, dest, other);
    }
  }
}

export function combineMeta(dest: ItemMetaInfo, other: ItemMetaInfo) {
  combineProperty('page', dest, other);
  combineProperty('pageTitle', dest, other);
  dest.platforms = mergeLists(dest.platforms, other.platforms);
  combineProperty('ignorablePlatforms', dest, other);
  if (other.categories) {
    if (dest.categories) {
      if (other.categories.length !== dest.categories.length ||
          other.categories.every((x, i) => x === dest.categories![i])) {
        addException(dest, 'merging', 'categories', other.categories);
      }
    } else
      dest.categories = other.categories;
  }
  deepMergeProperty('exceptions', dest, other, dest);
  dest.sources.push(...other.sources);
}

function deepMergeProperty(property: string, dest: any, other: any, meta: ItemMetaInfo) {
  if (property in other) {
    if (property in dest) {
      const destValue = dest[property];
      const otherValue = other[property];
      if (typeof destValue === 'object') {
        if (typeof otherValue === 'object') {
          if (Array.isArray(destValue)) {
            if (Array.isArray(otherValue))
              dest[property] = mergeLists(destValue, otherValue);
            else
              addException(meta, 'merging', property, otherValue);
          } else {
            let keys = mergeLists(Object.keys(destValue), Object.keys(otherValue));
            keys.forEach(k => deepMergeProperty(k, destValue, otherValue, meta));
          }
        } else
          addException(meta, 'merging', property, otherValue);
      } else {
        if (destValue !== otherValue)
          addException(meta, 'merging', property, otherValue);
      }
    } else {
      dest[property] = other[property];
    }
  }
}

function combineProperty<K extends keyof ItemMetaInfo>(prop: K, dest: ItemMetaInfo, other: ItemMetaInfo) {
  if (!trySetProperty(prop, dest, other))
    addException(dest, 'merging', prop, other[prop]);
}
function trySetProperty<T extends object, K extends keyof T>(prop: K, dest: T, other: T): boolean {
  if (prop in other) {
    if (prop in dest) {
      return dest[prop] === other[prop];
    } else
      dest[prop] = other[prop];
  }
  return true;
}

function setVaryingProperty<T extends object, K extends keyof T, P extends keyof any>(property: K, dest: VaryingObject<T, P>, src: VaryingObject<T, P>) {
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
