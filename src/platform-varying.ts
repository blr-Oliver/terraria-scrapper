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

export function transform<In, Out>(input: PlatformVaryingValue<In>, operation: (value: In) => Out): PlatformVaryingValue<Out> {
  let result: PlatformVaryingValue<Out> = {};
  for (let key of ALL_PLATFORMS) {
    if (key in input)
      result[key] = operation(input[key]!);
  }
  return result;
}
