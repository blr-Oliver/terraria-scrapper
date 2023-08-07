import {ALL_PLATFORMS, makeVarying, PlatformList, PlatformVaryingValue} from '../platform-varying';
import {CellParser, HeaderContext} from './cell-parsers';
import {extractVaryingDecimal, extractVaryingInteger, extractVaryingPercent, extractVaryingString, unwrapSingleChildElement} from './extract-varying';
import {ParserProvider} from './parse-table';

export type ValueParser<T> = (el: Element, platforms?: PlatformList) => PlatformVaryingValue<T>;

export const parseString: ValueParser<string> = (el: Element, platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return extractVaryingString(unwrapSingleChildElement(el), platforms);
}

export const parseInteger: ValueParser<number> = (el: Element, platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return extractVaryingInteger(unwrapSingleChildElement(el), platforms);
}

export const parseDecimal: ValueParser<number> = (el: Element, platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return extractVaryingDecimal(unwrapSingleChildElement(el), platforms);
}

export const parsePercent: ValueParser<number> = (el: Element, platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return extractVaryingPercent(unwrapSingleChildElement(el), platforms);
}

export const parseFlag: ValueParser<boolean> = (el: Element, platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return makeVarying(!!el.querySelector('.t-yes'), platforms);
}

export const parseNumberOrInfinity: ValueParser<number> = (el: Element, platforms: PlatformList = ALL_PLATFORMS as PlatformList) => {
  return isInfinity(el) ? makeVarying(-1, platforms) : parseDecimal(el, platforms);

  function isInfinity(el: Element) {
    const textContent = el.textContent!.trim().toLowerCase();
    if (textContent.length === 1 && textContent.charCodeAt(0) === 0x221e /* ∞ */) return true;
    let sortValue = el.getAttribute('data-sort-value');
    if (sortValue && +sortValue >= 100) return true;
    if (el.childElementCount === 1 && el.children[0].matches('div[title="Infinite"]'))
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