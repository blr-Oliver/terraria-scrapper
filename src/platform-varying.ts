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

export type RequiredFields<T> = keyof {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K]
}
export type OptionalFields<T> = keyof {
  [K in keyof T as T[K] extends Required<T>[K] ? never : K]: T[K]
}
export type ObjectFields<T> = keyof {
  [K in keyof T as Exclude<T[K], undefined> extends object ? K : never]: T[K]
}
export type PrimitiveFields<T> = keyof {
  [K in keyof T as Exclude<T[K], undefined> extends object ? never : K]: T[K]
}

type RequiredObjectFields<T> = RequiredFields<T> & ObjectFields<T>;
type RequiredPrimitiveFields<T> = RequiredFields<T> & PrimitiveFields<T>;
type OptionalObjectFields<T> = OptionalFields<T> & ObjectFields<T>;
type OptionalPrimitiveFields<T> = OptionalFields<T> & PrimitiveFields<T>;

//workaround to avoid distributed conditional types
export type PlatformVaryingObject<T extends object> = {
  [K in RequiredObjectFields<T>]: PlatformVarying<T[K]>;
} & {
  [K in RequiredPrimitiveFields<T>]: PlatformVaryingValue<T[K]>;
} & {
  [K in OptionalObjectFields<T>]?: PlatformVarying<Exclude<T[K], undefined>>;
} & {
  [K in OptionalPrimitiveFields<T>]?: PlatformVaryingValue<Exclude<T[K], undefined>>;
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

export function transform<In, Out>(input: PlatformVaryingValue<In>, operation: (value: In) => Out): PlatformVaryingValue<Out> {
  let result: PlatformVaryingValue<Out> = {};
  for (let key of ALL_PLATFORMS) {
    if (key in input)
      result[key] = operation(input[key]!);
  }
  return result;
}