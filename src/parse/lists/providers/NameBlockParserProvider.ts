import {ItemCard} from '../../../common/types';
import {makeVarying, PlatformList, PlatformVarying} from '../../../platform-varying';
import {parseImage} from '../../common-parsers';
import {extractPlatformsFromClasses, extractVaryingValue, flagsNodeMatcher, Node, selectorMatcher, unwrapSingleChildElement} from '../../extract-varying';
import {CellContext, HeaderContext, ICellParser, ParserProvider} from '../cell-parsers';
import {constructPropertyParser} from './CommonParserProvider';

export abstract class NameBlockParserProvider implements ParserProvider {
  protected readonly imageCellParser: ICellParser;
  protected readonly nameCellParser: ICellParser;
  protected readonly basicNameNodeMatcher: (node: Node) => boolean;

  protected constructor(nameNodeValueSelector: string) {
    this.imageCellParser = constructPropertyParser('image', parseImage);
    this.nameCellParser = {
      parse: (td, item, context) => {
        this.parseNameCell(td, item, context);
      },
      getPlatforms: (td, item, context) => {
        this.parseNameCell(td, item, context);
        return Object.keys(item.name!) as PlatformList;
      }
    };
    this.basicNameNodeMatcher = selectorMatcher(nameNodeValueSelector);
  }

  getParser(header: HeaderContext): ICellParser | undefined {
    let caption = header.th.textContent!.trim().toLowerCase();
    if (caption === '') {
      if (header.column === 0)
        return this.imageCellParser;
    } else if (this.isNameBlock(caption, header)) {
      if (header.colSpan === 1 || header.colSpan === 2 && header.shift === 1)
        return this.nameCellParser;
      else if (header.colSpan === 2 && header.shift === 0)
        return this.imageCellParser;
    }
  }

  protected abstract isNameBlock(caption: string, header: HeaderContext): boolean;

  protected parseNameCell(td: HTMLTableCellElement, item: PlatformVarying<ItemCard>, context: CellContext) {
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

    item['page'] = extractVaryingValue<string, string>(src,
        nameValueNodeMatcher,
        flagsNodeMatcher,
        node => (node as HTMLElement).getAttribute('href') || '',
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