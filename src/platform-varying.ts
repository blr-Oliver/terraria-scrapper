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

export type PlatformVaryingValue<T> = {
  [key in PlatformName]?: T
}

export type PlatformVaryingObject<T extends object> = {
  [K in keyof T]: T[K] extends undefined ? never : PlatformVarying<T[K]>;
}

export type PlatformVarying<T> =
    T extends Array<infer E> ? Array<PlatformVarying<E>> :
        T extends Function ? PlatformVaryingValue<T> :
            T extends object ? PlatformVaryingObject<T> :
                PlatformVaryingValue<T>;

export function forAllPlatforms<T>(value: T): PlatformVaryingValue<T> {
  return {
    pc: value,
    console: value,
    oldGen: value,
    mobile: value,
    threeDS: value
  }
}