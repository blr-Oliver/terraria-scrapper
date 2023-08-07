import {JSDOM} from 'jsdom';
import {Platform, PlatformList, PlatformName, PlatformVaryingValue} from '../platform-varying';

export const Node = new JSDOM('').window.Node;

/**
 * @template I type of intermediate value from collapsing value nodes
 * @template T value type
 */
export function extractVaryingValue<I, T>(src: Element,
                                          valueNodeMatcher: (node: Node) => boolean,
                                          flagsNodeMatcher: (node: Node) => boolean,
                                          valueNodeExtractor: (node: Node) => I,
                                          flagsNodeExtractor: (node: Node) => PlatformList,
                                          valueMerger: (a: (I | null), x: I) => I,
                                          valueFinalizer: (x: I) => T,
                                          defaultPlatforms: PlatformName[]): PlatformVaryingValue<T> {
  src.normalize();
  let flatNodes = flattenNodes(src, node => valueNodeMatcher(node) || flagsNodeMatcher(node));
  let result: PlatformVaryingValue<T> = {};
  let i = 0;
  while (i < flatNodes.length) {
    let accum: I | null = null;
    while (i < flatNodes.length && valueNodeMatcher(flatNodes[i]))
      accum = valueMerger(accum, valueNodeExtractor(flatNodes[i++]));
    const value: T = valueFinalizer(accum!);
    let flags: PlatformList;
    if (i < flatNodes.length) {
      flags = flagsNodeExtractor(flatNodes[i++]);
    } else {
      if (Object.keys(result).length === 0 || !!value)
        flags = defaultPlatforms;
      else
        flags = [];
    }
    for (let flag of flags)
      result[flag] = value;
  }
  return result;
}

export function unwrapSingleChildElement(el: Element): Element {
  if (el.childElementCount === 1) {
    let immediateText = [...el.childNodes]
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(text => text.nodeValue!)
        .join('');
    if (immediateText.trim() === '')
      return unwrapSingleChildElement(el.children[0]);
  }
  return el;
}

function flattenNodes(elem: Element, filter: (node: Node) => boolean): Node[] {
  let result: Node[] = [];
  collectLeaves(elem, filter, result);
  return result;

  function collectLeaves(node: Node, filter: (node: Node) => boolean, collect: Node[]) {
    let childNodes = node.childNodes;
    if (filter(node))
      collect.push(node);
    else if (childNodes && childNodes.length)
      childNodes.forEach(node => collectLeaves(node, filter, collect));
  }
}

function extractAsStringWithFinalizer<T>(src: Element, valueFinalizer: (value: string) => T, platforms: PlatformName[]): PlatformVaryingValue<T> {
  return extractVaryingValue<string, T>(src,
      node => node.parentNode === src && node.nodeType === Node.TEXT_NODE,
      selectorMatcher('.eico'),
      node => node.nodeValue!,
      node => extractPlatformsFromClasses(node as Element),
      (a, b) => (a || '') + b,
      valueFinalizer,
      platforms
  );
}

export function extractVaryingString(src: Element, platforms: PlatformName[]): PlatformVaryingValue<string> {
  return extractAsStringWithFinalizer(src, stripLeadingOrTrailingSlash, platforms);
}

export function extractVaryingNumber(src: Element, valueFinalizer: (value: string) => number, platforms: PlatformName[]): PlatformVaryingValue<number> {
  return extractAsStringWithFinalizer(src, s => valueFinalizer(stripLeadingOrTrailingSlash(s)), platforms);
}

/**
 * @deprecated prefer extract integer / decimal
 */
export function extractVaryingExplicitNumber(src: Element, platforms: PlatformName[]): PlatformVaryingValue<number> {
  return extractVaryingNumber(src, s => +s, platforms);
}

export function extractVaryingInteger(src: Element, platforms: PlatformName[]): PlatformVaryingValue<number> {
  return extractVaryingNumber(src, s => parseInt(s), platforms);
}

export function extractVaryingDecimal(src: Element, platforms: PlatformName[]): PlatformVaryingValue<number> {
  return extractVaryingNumber(src, s => parseFloat(s), platforms);
}

export function extractVaryingPercent(src: Element, platforms: PlatformName[]): PlatformVaryingValue<number> {
  return extractAsStringWithFinalizer(src, s => +stripLeadingOrTrailingSlash(s).trim().slice(0, -1), platforms);
}

export function extractVaryingCoinValue(src: Element, platforms: PlatformName[]): PlatformVaryingValue<number> {
  return extractVaryingValue<number, number>(src,
      selectorMatcher('.coin[data-sort-value]'),
      selectorMatcher('.eico'),
      node => +(node as Element).getAttribute('data-sort-value')!,
      node => extractPlatformsFromClasses(node as Element),
      (a, b) => a || b,
      x => x,
      platforms
  );
}

export function extractPlatformsFromClasses(iconList: Element): PlatformList {
  let result: PlatformList = [];
  iconList.classList.forEach(className => {
    let match = className.match(/i(\d+)/);
    if (match) {
      let idx = +match[1];
      if (idx && (idx in Platform))
        result.push(Platform[idx] as PlatformName);
    }
  });
  return result;
}

export function stripLeadingOrTrailingSlash(value: string): string {
  let match = value.match(/\s*\/?\s*(.*\S*)\s*\/?\s*/);
  return match ? match[1] : value;
}

export function selectorMatcher(selector: string, parent?: Element): (node: Node) => boolean {
  return (node: Node) => node.nodeType === Node.ELEMENT_NODE && (!parent || parent === node.parentNode) && (node as Element).matches(selector);
}