import {makeVarying, PlatformList} from '../../../platform-varying';
import {ParsedListItem} from '../../common';
import {parseImage} from '../../common-parsers';
import {extractPlatformsFromClasses, extractVaryingValue, flagsNodeMatcher, Node, unwrapSingleChildElement} from '../../extract-varying';
import {CellContext, HeaderContext, ICellParser, ParserProvider} from '../cell-parsers';
import {constructPropertyParser} from './CommonParserProvider';

export class AmmoNameBlockParserProvider implements ParserProvider {
  private readonly imageCellParser = constructPropertyParser('image', parseImage);
  private readonly nameCellParser: ICellParser = {
    parse: (td, item, context) => {
      this.parseNameCell(td, item, context);
    },
    getPlatforms: (td, item, context) => {
      this.parseNameCell(td, item, context);
      return Object.keys(item.name!) as PlatformList;
    }
  };
  private readonly basicNameNodeMatcher: (node: Node) => boolean =
      (node: Node) => node.nodeType === Node.ELEMENT_NODE && (node as Element).matches('span[title]:first-child');

  getParser(header: HeaderContext): ICellParser | undefined {
    let caption = header.th.textContent!.trim().toLowerCase();
    if (caption === 'type' && header.table.isLined && this.isAmmoFile(header)) {
      if (header.colSpan === 1 || header.colSpan === 2 && header.shift === 1)
        return this.nameCellParser;
      else if (header.colSpan === 2 && header.shift === 0)
        return this.imageCellParser;
    } else if (caption === '') {
      if (header.column === 0)
        return this.imageCellParser;
    }
  }

  private isAmmoFile(header: HeaderContext): boolean {
    let fileName = header.table.file.toLowerCase();
    return fileName.indexOf('rockets') !== -1 || fileName.indexOf('bombs') !== -1;
  }

  parseNameCell(td: HTMLTableCellElement, item: ParsedListItem, context: CellContext) {
    let src = unwrapSingleChildElement(td);
    let idBlock = src.querySelector('.id');
    let platforms = context.platforms || context.table.platforms;
    let nameValueNodeMatcher = this.basicNameNodeMatcher;

    if (idBlock) {
      nameValueNodeMatcher = (node: Node) => this.basicNameNodeMatcher(node) && !idBlock!.contains(node);
    }

    item.name = extractVaryingValue<string, string>(src,
        nameValueNodeMatcher,
        flagsNodeMatcher,
        node => node.textContent!.trim(),
        node => extractPlatformsFromClasses(node as Element),
        (a, b) => (a || '') + b,
        x => x,
        platforms
    )

    platforms = Object.keys(item.name) as PlatformList;

    if (idBlock) {
      let text = idBlock.textContent!;
      let id = +text.slice(text.indexOf(':') + 1).trim();
      item.id = makeVarying(id, platforms);
    }
  }
}