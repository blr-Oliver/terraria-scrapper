export type VaryingValue<T, K extends keyof any> = {
  [key in K]?: T
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

export type RequiredObjectFields<T> = RequiredFields<T> & ObjectFields<T>;
export type RequiredPrimitiveFields<T> = RequiredFields<T> & PrimitiveFields<T>;
export type OptionalObjectFields<T> = OptionalFields<T> & ObjectFields<T>;
export type OptionalPrimitiveFields<T> = OptionalFields<T> & PrimitiveFields<T>;

//workaround to avoid distributed conditional types
export type VaryingObject<T extends object, K extends keyof any> = {
  [KK in RequiredObjectFields<T>]: Varying<T[KK], K>;
} & {
  [KK in RequiredPrimitiveFields<T>]: VaryingValue<T[KK], K>;
} & {
  [KK in OptionalObjectFields<T>]?: Varying<Exclude<T[KK], undefined>, K>;
} & {
  [KK in OptionalPrimitiveFields<T>]?: VaryingValue<Exclude<T[KK], undefined>, K>;
}

export type Varying<T, K extends keyof any> =
    T extends Array<infer E> ? VaryingValue<Array<E>, K> :
        T extends Function ? VaryingValue<T, K> :
            T extends object ? VaryingObject<T, K> :
                VaryingValue<T, K>;
