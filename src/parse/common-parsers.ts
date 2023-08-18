import {makeVarying, PlatformList, PlatformVaryingValue, transform} from '../platform-varying';
import {
  extractMatchedSelectors,
  extractPlatformsFromClasses,
  extractVaryingDecimal,
  extractVaryingInteger,
  extractVaryingPercent,
  extractVaryingString,
  extractVaryingValue, flagsNodeMatcher,
  selectorMatcher,
  unwrapSingleChildElement
} from './extract-varying';

export type ValueParser<T> = (el: Element, platforms: PlatformList) => PlatformVaryingValue<T>;

export const parseString: ValueParser<string> = (el: Element, platforms: PlatformList) => {
  return extractVaryingString(unwrapSingleChildElement(el), platforms);
}

export const parseInteger: ValueParser<number> = (el: Element, platforms: PlatformList) => {
  return extractVaryingInteger(unwrapSingleChildElement(el), platforms);
}

export const parseDecimal: ValueParser<number> = (el: Element, platforms: PlatformList) => {
  return extractVaryingDecimal(unwrapSingleChildElement(el), platforms);
}

export const parsePercent: ValueParser<number> = (el: Element, platforms: PlatformList) => {
  return extractVaryingPercent(unwrapSingleChildElement(el), platforms);
}

export const parseFlag: ValueParser<boolean> = (el: Element, platforms: PlatformList) => {
  return transform(
      extractMatchedSelectors(el, platforms, '.t-yes', '.t-no'),
      selectors => selectors.some(s => s === '.t-yes'));
}

export const parseNumberOrInfinity: ValueParser<number> = (el: Element, platforms: PlatformList) => {
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

export const parseSortableNumber: ValueParser<number> = (el: Element, platforms: PlatformList) => {
  let hasSortKey = !!el.querySelector('s.sortkey');
  return hasSortKey ? parseSortKey(el, platforms) : parseSortValue(el, platforms);
}

export const parseImage: ValueParser<string> = (el: Element, platforms: PlatformList) => {
  return makeVarying(el.querySelector<HTMLImageElement>('img[src]')!.src, platforms);
}

function parseSortValue(el: Element, platforms: PlatformList): PlatformVaryingValue<number> {
  return extractVaryingValue<number, number>(el,
      selectorMatcher('[data-sort-value]'),
      flagsNodeMatcher,
      node => +(node as Element).getAttribute('data-sort-value')!,
      node => extractPlatformsFromClasses(node as Element),
      (a, b) => a || b,
      x => x,
      platforms
  );
}

function parseSortKey(el: Element, platforms: PlatformList) {
  return extractVaryingValue<number, number>(el,
      selectorMatcher('s.sortkey'),
      flagsNodeMatcher,
      node => parseInt((node as Element).textContent!.trim()),
      node => extractPlatformsFromClasses(node as Element),
      (a, b) => a || b,
      x => x,
      platforms
  );
}

export const COMMON_PARSERS: { [type: string]: ValueParser<unknown> } = {
  'string': parseString,
  'integer': parseInteger,
  'decimal': parseDecimal,
  'percent': parsePercent,
  'number': parseNumberOrInfinity,
  'sortable': parseSortableNumber,
  'flag': parseFlag,
  'image': parseImage
}
