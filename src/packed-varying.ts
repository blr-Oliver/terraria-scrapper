import {VaryingValue} from './varying';

export type PackedVaryingValue<T, K extends keyof any> = VaryingValue<Partial<T>, K> & {
  base?: Partial<T>;
  varying?: VaryingValue<Partial<T>, K>;
  variants: K[];
}
