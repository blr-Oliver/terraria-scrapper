import {Item, ItemCard} from '../../../common/types';
import {makeVarying, PlatformList, PlatformVarying} from '../../../platform-varying';
import {parseImage} from '../../common-parsers';
import {extractPlatformsFromClasses, extractVaryingValue, flagsNodeMatcher, Node, selectorMatcher, unwrapSingleChildElement} from '../../extract-varying';
import {CellContext, HeaderContext, ICellParser, ParserProvider} from '../cell-parsers';
import {constructPropertyParser} from './CommonParserProvider';

export const NAME_PARSED_FLAG = Symbol('name parsed');

export abstract class NameBlockParserProvider implements ParserProvider {
  protected readonly imageCellParser: ICellParser;
  protected readonly nameCellParser: ICellParser;
  protected readonly basicNameNodeMatcher: (node: Node) => boolean;

  protected constructor(nameNodeValueSelector: string) {
    this.imageCellParser = constructPropertyParser('image', parseImage);
    this.nameCellParser = {
      parse: (td, card, item, context) => {
        this.parseNameCell(td, card, item, context);
      },
      getPlatforms: (td, card, item, context) => {
        this.parseNameCell(td, card, item, context);
        return item.meta.platforms;
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

  protected parseNameCell(td: HTMLTableCellElement, card: PlatformVarying<ItemCard>, item: Item, context: CellContext) {
    if (NAME_PARSED_FLAG in item) return;
    let src = unwrapSingleChildElement(td);
    let idBlock = src.querySelector('.id');
    let platforms = context.platforms || context.table.platforms;
    let nameValueNodeMatcher = this.basicNameNodeMatcher;

    if (idBlock) {
      nameValueNodeMatcher = (node: Node) => this.basicNameNodeMatcher(node) && !idBlock!.contains(node);
    }

    const varyingName = extractVaryingValue<string, string>(src,
        nameValueNodeMatcher,
        flagsNodeMatcher,
        node => node.textContent!.trim(),
        node => extractPlatformsFromClasses(node as Element),
        (a, b) => (a || '') + b,
        x => x,
        platforms
    )

    item.meta.platforms = platforms = Object.keys(varyingName) as PlatformList;
    item.name = varyingName[platforms[0]]!;

    const varyingPage = extractVaryingValue<string, string>(src,
        nameValueNodeMatcher,
        flagsNodeMatcher,
        node => (node as HTMLElement).getAttribute('href') || '',
        node => extractPlatformsFromClasses(node as Element),
        (a, b) => (a || '') + b,
        x => x,
        platforms
    )

    item.meta.page = varyingPage[platforms[0]]!;

    if (idBlock) {
      let text = idBlock.textContent!;
      let id = +text.slice(text.indexOf(':') + 1).trim();
      card.id = makeVarying(id, platforms);
    }
    (item as any)[NAME_PARSED_FLAG] = true;
  }
}