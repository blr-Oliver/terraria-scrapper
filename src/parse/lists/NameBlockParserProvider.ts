import {ALL_PLATFORMS, makeVarying, PlatformList} from '../../platform-varying';
import {parseImage} from '../common-parsers';
import {extractPlatformsFromClasses, extractVaryingValue, Node, selectorMatcher, unwrapSingleChildElement} from '../extract-varying';
import {CellContext, HeaderContext, ICellParser, ParsedItem} from './cell-parsers';
import {constructPropertyParser} from './CommonParserProvider';
import {ParserProvider} from './parse-table';

export class NameBlockParserProvider implements ParserProvider {
  private readonly imageCellParser = constructPropertyParser('image', parseImage);
  private readonly nameCellParser: ICellParser = {
    parse: (td, item, context) => {
      this.parseNameCell(td, item, context);
    },
    isPlatformSource: true
  };

  getParser(header: HeaderContext): ICellParser | undefined {
    let caption = header.th.textContent!.trim().toLowerCase();
    if (caption === 'name' || caption == 'item') {
      if (header.colSpan === 1 || header.colSpan === 2 && header.shift === 1)
        return this.nameCellParser;
      else if (header.colSpan === 2 && header.shift === 0)
        return this.imageCellParser;
    } else if (caption === '') {
      if (header.column === 0)
        return this.imageCellParser;
    }
  }

  parseNameCell(td: HTMLTableCellElement, item: ParsedItem, context: CellContext) {
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
}