import {PlatformVarying, PlatformVaryingValue} from '../platform-varying';
import {BaseItemDescriptor, ParsingException} from './lists/cell-parsers';

export type ItemDescriptor = BaseItemDescriptor & { [key: string]: any };
export type ParsingExceptions = {
  exceptions?: ParsingException[];
}
export type ParsedItem = PlatformVarying<ItemDescriptor> & ParsingExceptions;

export type ItemListPerSection = { [section: string]: ParsedItem[] };
export type NormalizedItem = PlatformVaryingValue<ItemDescriptor>;