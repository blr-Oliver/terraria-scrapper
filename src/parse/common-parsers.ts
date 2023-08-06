import {ALL_PLATFORMS, makeVarying, PlatformList, PlatformVaryingValue} from '../platform-varying';
import {CellContext, CellParser, HeaderContext, ParsedItem} from './cell-parsers';
import {extractVaryingDecimal, extractVaryingInteger, extractVaryingPercent, extractVaryingString} from './extract-varying';
import {ParserProvider} from './parse-table';

export type ValueParser<T> = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext,
                              platforms?: PlatformList) => PlatformVaryingValue<T>;

export const parseString: ValueParser<string> = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext,
                                                 platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return extractVaryingString(td, platforms);
}

export const parseInteger: ValueParser<number> = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext,
                                                  platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return extractVaryingInteger(td, platforms);
}

export const parseDecimal: ValueParser<number> = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext,
                                                  platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return extractVaryingDecimal(td, platforms);
}

export const parsePercent: ValueParser<number> = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext,
                                                  platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return extractVaryingPercent(td, platforms);
}

export const parseFlag: ValueParser<boolean> = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext,
                                                platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return makeVarying(!!td.querySelector('.t-yes'), platforms);
}

export const parseNumberOrInfinity: ValueParser<number> = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext,
                                                           platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return isInfinity(td) ? makeVarying(Infinity, platforms) : parseDecimal(td, item, context, platforms);

  function isInfinity(td: HTMLTableCellElement) {
    const textContent = td.textContent!.trim().toLowerCase();
    if (textContent.length === 1 && textContent.charCodeAt(0) === 0x221e /* ∞ */) return true;
    let sortValue = td.getAttribute('data-sort-value');
    if (sortValue && +sortValue >= 100) return true;
    if (td.childElementCount === 1 && td.children[0].matches('div[title="Infinite"]'))
      return true;
    return false;
  }
}

export const COMMON_PARSERS: { [type: string]: ValueParser<unknown> } = {
  'string': parseString,
  'integer': parseInteger,
  'decimal': parseDecimal,
  'percent': parsePercent,
  'number': parseNumberOrInfinity,
  'flag': parseFlag
}

export const NOOP_PARSER: CellParser = () => {
};

export const NOOP_PARSER_PROVIDER: ParserProvider = {
  getParser(header: HeaderContext): CellParser | undefined {
    return NOOP_PARSER;
  }
}