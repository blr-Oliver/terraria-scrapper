import {ItemCard} from '../common/types';
import {PlatformList, PlatformVarying} from '../platform-varying';

export function combineCards(dest: PlatformVarying<ItemCard>, other: PlatformVarying<ItemCard>, platforms: PlatformList, exceptions: any) {
  let srcKeys = Object.keys(other) as (keyof ItemCard)[];
  for (let property of srcKeys) {
    if (property in dest) {
      let destMap = dest[property]!;
      let srcMap = other[property]!;
      for (let platform of platforms) {
        if (platform in srcMap) {
          if (platform in destMap) {
            let srcValue = srcMap[platform]!;
            let destValue = destMap[platform]!;
            if (property === 'image') {
              destMap[platform] = mergeLists(destValue as string[], srcValue as string[]);
            } else {
              if (!deepEqual(destValue, srcValue)) {
                addException(exceptions, 'conflict', `'${property}' for platform '${platform}'`);
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

function deepEqual(a: any, b: any): boolean {
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') {
    if (Array.isArray(a)) {
      return Array.isArray(b) && arrayDeepEqual(a, b);
    } else if (Array.isArray(b)) {
      return false;
    } else {
      let aKeys = Object.keys(a).sort();
      let bKeys = Object.keys(b).sort();
      if (aKeys.length !== bKeys.length || aKeys.some((k, i) => k !== bKeys[i])) return false;
      for (let aKey of aKeys) {
        if (!deepEqual(a[aKey], b[aKey])) return false;
      }
      return true;
    }
  } else {
    return a === b;
  }
}

function primitiveArrayContentEqual(a: any[], b: any[]): boolean {
  let aValues = [...new Set(a).keys()].sort();
  let bValues = [...new Set(b).keys()].sort();
  return aValues.length === bValues.length && aValues.every((e, i) => e === bValues[i]);
}

function arrayDeepEqual(a: any[], b: any[]): boolean {
  if (a.length === 0) {
    return b.length === 0;
  } else if (b.length === 0) {
    return false;
  } else {
    if (typeof a[0] === 'object') {
      return a.length === b.length && a.every((e, i) => deepEqual(e, b[i]));
    } else
      return primitiveArrayContentEqual(a, b);
  }
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

function addException(exceptions: any, key: string, value: string) {
  if (!(key in exceptions)) exceptions[key] = [];
  exceptions[key].push(value);
}