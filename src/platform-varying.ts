import {Varying, VaryingValue} from './varying';

export enum Platform {
  pc = 1,
  console = 2,
  oldGen = 3,
  mobile = 4,
  threeDS = 5
}

export type PlatformName = keyof typeof Platform;
export type PlatformList = PlatformName[];
export const ALL_PLATFORMS: ReadonlyArray<PlatformName> = ['pc', 'console', 'oldGen', 'mobile', 'threeDS'];

export type PlatformVaryingValue<T> = VaryingValue<T, PlatformName>;
export type PlatformVarying<T> = Varying<T, PlatformName>;

export function makeVarying<T>(value: T, platforms: PlatformName[] = ALL_PLATFORMS as PlatformName[]): PlatformVaryingValue<T> {
  let result: PlatformVaryingValue<T> = {};
  for (let platform of platforms)
    result[platform] = value;
  return result;
}

export function forAllPlatforms<T>(value: T): PlatformVaryingValue<T> {
  return {
    pc: value,
    console: value,
    oldGen: value,
    mobile: value,
    threeDS: value
  }
}

export function transform<In, Out>(input: PlatformVaryingValue<In>, operation: (value: In) => Out): PlatformVaryingValue<Out> {
  let result: PlatformVaryingValue<Out> = {};
  for (let key of ALL_PLATFORMS) {
    if (key in input)
      result[key] = operation(input[key]!);
  }
  return result;
}

const check = forAllPlatforms(true);
export function isPlatformVarying(obj: object): obj is PlatformVaryingValue<{}> {
  for (let key in obj)
    if (!(key in check)) return false;
  return true;
}

export function pullToTop<T>(input: {}, platforms: PlatformName[] = ALL_PLATFORMS as PlatformName[]): PlatformVaryingValue<T> {
  if (typeof input !== 'object')
    return forAllPlatforms(input as T);
  if (isPlatformVarying(input)) {
    return input as PlatformVaryingValue<T>;
  }
  let result: PlatformVaryingValue<T> = {};
  pullInto(result, input, [], platforms);
  return result;
}

function pullInto(root: PlatformVaryingValue<unknown>, context: object, path: (string | number)[], platforms: PlatformName[]) {
  if (isPlatformVarying(context)) {
    for (let key in context)
      setProperty(root, [key, ...path], context[key as PlatformName]);
  } else {
    if (Array.isArray(context)) {
      context.forEach((value, i) => processKey(i, value));
    } else {
      for (let key in context)
        processKey(key, (context as any)[key]);
    }
  }

  function processKey(key: string | number, value: any) {
    path.push(key);
    if (typeof value === 'object') {
      pullInto(root, value, path, platforms);
    } else {
      for (let platform of platforms)
        setProperty(root, [platform, ...path], value);
    }
    path.pop();
  }
}

function setProperty(target: object, path: (string | number)[], value: any) {
  let context: any = target;
  for (let i = 0; i < path.length - 1; ++i) {
    let pathKey = path[i];
    let nextContext = context[pathKey];
    if (nextContext == undefined) {
      let nextKey = path[i + 1];
      let newContext = isNaN(+nextKey) ? {} : [];
      context = context[pathKey] = newContext;
    } else {
      context = nextContext;
    }
  }
  context[path[path.length - 1]] = value;
}