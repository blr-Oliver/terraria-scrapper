import {makeVarying} from '../../../platform-varying';
import {ParsedListItem} from '../../common';
import {CellContext, HeaderContext, ICellParser, ParserProvider} from '../cell-parsers';

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

  parseWhipEffectCell(td: HTMLTableCellElement, item: ParsedListItem, context: CellContext) {
    let platforms = context.platforms;
    let text = td.textContent!.trim().toLowerCase();
    let tagMatch = text.match(WhipEffectParserProvider.TAG_PATTERN);
    let critMatch = text.match(WhipEffectParserProvider.CRIT_PATTERN);
    if (tagMatch)
      item['tagDamage'] = makeVarying(+tagMatch[1], platforms);
    if (critMatch)
      item['tagCrit'] = makeVarying(+critMatch[1], platforms);
  }
}