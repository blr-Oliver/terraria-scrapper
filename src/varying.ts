export type VaryingValue<T, U extends keyof any> = {
  [key in U]?: T
}

export type VaryingObject<T extends object, U extends keyof any> = {
  [K in keyof T]: VaryingValue<T[K], U>;
}

export type Varying<T, U extends keyof any> =
    T extends Array<infer E> ? VaryingValue<Array<E>, U> :
        T extends Function ? VaryingValue<T, U> :
            T extends object ? VaryingObject<T, U> :
                VaryingValue<T, U>;
