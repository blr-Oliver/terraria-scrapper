import {ALL_PLATFORMS, makeVarying, PlatformList} from '../../platform-varying';
import {CellContext, HeaderContext, ICellParser, ParsedItem} from './cell-parsers';
import {ParserProvider} from './parse-table';

export class WhipEffectParserProvider implements ParserProvider {
  private static readonly TAG_PATTERN = /(?:(\d+)\s+summon\s+tag\s+damage)/;
  private static readonly CRIT_PATTERN = /(?:(\d+)%\s+critical\s+chance)/;
  private readonly parser: ICellParser = {
    parse: (td, item, context) => {
      this.parseWhipEffectCell(td, item, context);
    }
  };

  getParser(header: HeaderContext): ICellParser | undefined {
    let caption = header.th.textContent!.trim().toLowerCase();
    if (caption.startsWith('on-hit')) {
      if (header.table.file.toLowerCase().indexOf('whips') !== -1)
        return this.parser;
    }
  }

  parseWhipEffectCell(td: HTMLTableCellElement, item: ParsedItem, context: CellContext) {
    let platforms = ALL_PLATFORMS as PlatformList;
    let text = td.textContent!.trim().toLowerCase();
    let tagMatch = text.match(WhipEffectParserProvider.TAG_PATTERN);
    let critMatch = text.match(WhipEffectParserProvider.CRIT_PATTERN);
    if (tagMatch)
      item['tagDamage'] = makeVarying(+tagMatch[1], platforms);
    if (critMatch)
      item['tagCrit'] = makeVarying(+critMatch[1], platforms);
  }
}