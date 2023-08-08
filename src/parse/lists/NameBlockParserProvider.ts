import {parseImage} from '../common-parsers';
import {CellParser, HeaderContext} from './cell-parsers';
import {constructPropertyParser} from './CommonParserProvider';
import {parseNameCell} from './parse-name-cell';
import {ParserProvider} from './parse-table';

export class NameBlockParserProvider implements ParserProvider {
  private readonly imageCellParser = constructPropertyParser('image', parseImage);
  getParser(header: HeaderContext): CellParser | undefined {
    let caption = header.th.textContent!.trim().toLowerCase();
    if (caption === 'name' || caption == 'item') {
      if (header.colSpan === 1 || header.colSpan === 2 && header.shift === 1)
        return parseNameCell;
      else if (header.colSpan === 2 && header.shift === 0)
        return this.imageCellParser;
    } else if (caption === '') {
      if (header.column === 0)
        return this.imageCellParser;
    }
  }
}