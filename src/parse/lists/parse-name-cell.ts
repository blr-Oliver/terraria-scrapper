import {ALL_PLATFORMS, makeVarying, PlatformList} from '../../platform-varying';
import {extractPlatformsFromClasses, extractVaryingValue, Node, selectorMatcher, unwrapSingleChildElement} from '../extract-varying';
import {CellContext, CellParser, ParsedItem} from './cell-parsers';

export const parseNameCell: CellParser = (td: HTMLTableCellElement, item: ParsedItem, context: CellContext) => {
  let src = unwrapSingleChildElement(td);
  let idBlock = src.querySelector('.id');
  let platforms = ALL_PLATFORMS as PlatformList; // TODO it could be narrowed from outside
  let nameValueNodeMatcher = (node: Node) => node.nodeType === Node.ELEMENT_NODE && (node as Element).matches('a[href][title]');

  if (idBlock) {
    const plainMatcher = nameValueNodeMatcher;
    nameValueNodeMatcher = (node: Node) => plainMatcher(node) && !idBlock!.contains(node);
  }

  item.name = extractVaryingValue<string, string>(src,
      nameValueNodeMatcher,
      selectorMatcher('.eico'),
      node => node.textContent!.trim(),
      node => extractPlatformsFromClasses(node as Element),
      (a, b) => (a || '') + b,
      x => x,
      platforms
  )

  platforms = Object.keys(item.name) as PlatformList;

  item['page'] = extractVaryingValue<string, string>(src,
      nameValueNodeMatcher,
      selectorMatcher('.eico'),
      node => (node as HTMLAnchorElement).href,
      node => extractPlatformsFromClasses(node as Element),
      (a, b) => (a || '') + b,
      x => x,
      platforms
  )

  if (idBlock) {
    let text = idBlock.textContent!;
    let id = +text.slice(text.indexOf(':') + 1).trim();
    item.id = makeVarying(id, platforms);
  }
}