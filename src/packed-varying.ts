import {VaryingValue} from './varying';

export type PackedVaryingValue<T, K extends keyof any> = {
  base?: Partial<T>;
  varying?: VaryingValue<Partial<T>, K>;
  variants: K[];
}

// TODO pack is actually deep pack, but we don't need it deep, probably need to be simplified
export function pack<T, K extends keyof any>(src: VaryingValue<T, K>, allVariants?: K[]): PackedVaryingValue<T, K> {
  let variants: K[] = allVariants?.filter(key => key in src) ?? Object.keys(src) as K[];
  let target: PackedVaryingValue<T, K> = {
    variants
  };
  let values = variants.map(key => src[key]);
  let merged = merge(values);
  if (typeof merged.base !== 'undefined')
    target.base = merged.base;
  if (typeof merged.deltas !== 'undefined') {
    target.varying = {};
    for (let i = 0; i < variants.length; ++i) {
      const key = variants[i];
      const keyDelta = merged.deltas[i];
      if (typeof keyDelta !== 'undefined')
        target.varying[key] = keyDelta;
    }
  }
  return target;
}

export type ValueType = 'array' | 'object' | 'primitive';

export function getType(value: any): ValueType {
  if (Array.isArray(value)) return 'array';
  if (value == null) return 'primitive';
  if (typeof value === 'object') return 'object';
  return 'primitive';
}

type MergeResult = {
  base: any;
  deltas?: any[]
}
function mergePrimitives(values: any[]): MergeResult {
  const l = values.length;
  const dominantValue = getDominantValue(values);
  const result: MergeResult = {
    base: dominantValue,
    deltas: Array(l)
  }
  for (let i = 0; i < l; ++i) {
    let value = values[i];
    if (getType(value) !== 'primitive' || value !== dominantValue)
      result.deltas![i] = value;
  }
  return result;
}

function mergeArrays(values: any[]): MergeResult {
  const l = values.length;
  const result: MergeResult = {
    base: undefined,
    deltas: Array(l)
  };
  const dominantLength = getDominantValue(values
      .filter(x => getType(x) === 'array')
      .map(x => (x as any[]).length));
  result.base = Array(dominantLength);
  let survivorMapping: number[] = [];
  let survivors: any[][] = [];
  for (let i = 0; i < l; ++i) {
    let value = values[i];
    if (getType(value) !== 'array' || (value as any[]).length !== dominantLength)
      result.deltas![i] = value;
    else {
      survivors.push(value);
      survivorMapping.push(i);
    }
  }
  for (let i = 0; i < dominantLength; ++i) {
    let valuesAtPosition = survivors.map(arr => arr[i]);
    let mergedAtPosition = merge(valuesAtPosition);
    if (typeof mergedAtPosition.base !== 'undefined')
      result.base[i] = mergedAtPosition.base;
    if (mergedAtPosition.deltas) {
      for (let j = 0; j < mergedAtPosition.deltas.length; ++j) {
        let localIndex = survivorMapping[j];
        let delta = mergedAtPosition.deltas[j];
        if (typeof delta !== 'undefined') {
          if (!result.deltas![localIndex])
            result.deltas![localIndex] = Array(dominantLength);
          result.deltas![localIndex][i] = delta;
        }
      }
    }
  }
  return result;
}

function mergeObjects(values: any[]): MergeResult {
  const l = values.length;
  const result: MergeResult = {
    base: {},
    deltas: Array(l)
  }
  let survivorMapping: number[] = [];
  let survivors: object[] = [];
  for (let i = 0; i < l; ++i) {
    let value = values[i];
    if (getType(value) === 'object') {
      survivorMapping.push(i);
      survivors.push(value);
    } else {
      result.deltas![i] = value;
    }
  }
  const sLen = survivors.length;
  const keys = getCommonKeys(survivors);
  for (let commonKey of keys) {
    let keyValues = survivors.map(obj => (obj as any)[commonKey]);
    let mergedKeyValues = merge(keyValues);
    if (typeof mergedKeyValues.base !== 'undefined')
      result.base[commonKey] = mergedKeyValues.base;
    if (mergedKeyValues.deltas) {
      for (let i = 0; i < sLen; ++i) {
        let localIndex = survivorMapping[i];
        let deltaValue = mergedKeyValues.deltas[i];
        if (typeof deltaValue === 'undefined')
          continue;
        if (!result.deltas![localIndex])
          result.deltas![localIndex] = {};
        result.deltas![localIndex][commonKey] = deltaValue;
      }
    }
  }
  for (let i = 0; i < sLen; ++i) {
    let localIndex = survivorMapping[i];
    let survivor = survivors[i];
    for (let key in survivor) {
      let value = (survivor as any)[key];
      if (typeof value !== 'undefined' && !(key in result.base)) {
        if (!result.deltas![localIndex])
          result.deltas![localIndex] = {};
        result.deltas![localIndex][key] = value;
      }
    }
  }
  return result;
}

function merge(values: any[]): MergeResult {
  let result: MergeResult;
  const dominantType = getDominantType(values);
  if (dominantType === 'primitive') {
    result = mergePrimitives(values);
  } else if (dominantType === 'array') {
    result = mergeArrays(values);
  } else {
    result = mergeObjects(values);
  }
  if (result.deltas && result.deltas.every(x => typeof x === 'undefined'))
    delete result.deltas;
  return result;
}

const TypePriority = {
  'array': 2,
  'object': 1,
  'primitive': 3
}

function getDominantType(values: any[]): ValueType {
  const l = values.length;
  const types = new Map<ValueType, number>();
  for (let i = 0; i < l; ++i) {
    let value = values[i];
    if (typeof value === 'undefined') continue;
    let type = getType(value);
    types.set(type, (types.get(type) || 0) + 1);
  }
  if (!types.size) return 'primitive';
  const entries = [...types.entries()];
  entries.sort(([type1, n1], [type2, n2]) =>
      n2 - n1 || TypePriority[type1] - TypePriority[type2]);
  return entries[0][0];
}

function getDominantValue(values: any[]): any {
  const l = values.length;
  const counts = new Map<any, number>();
  for (let i = 0; i < l; ++i) {
    let value = values[i];
    if (typeof value === 'undefined' || getType(value) !== 'primitive') continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  const entries = [...counts.entries()];
  if (!entries.length) return void 0;
  entries.sort(([value1, n1], [value2, n2]) => n2 - n1);
  if (entries[0][1] <= 1 && entries.length > 1) return void 0;
  return entries[0][0];
}

function getCommonKeys(objects: object[]): string[] {
  let keys: string[] = [];
  let first = objects[0];
  const l = objects.length;
  nextKey: for (let key in first) {
    for (let i = 1; i < l; ++i) {
      if (!(key in objects[i]))
        continue nextKey;
    }
    keys.push(key);
  }
  return keys;
}