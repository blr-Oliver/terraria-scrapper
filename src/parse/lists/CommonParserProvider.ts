import {COMMON_PARSERS, ValueParser} from '../common-parsers';
import {HeaderContext, ICellParser, NOOP_PARSER} from './cell-parsers';
import {COMMON_PROPERTY_HEADERS, COMMON_PROPERTY_TYPES, IGNORED_HEADERS} from './known-constants';
import {ParserProvider} from './parse-table';

export class CommonParserProvider implements ParserProvider {
  getParser(header: HeaderContext): ICellParser | undefined {
    const headerText = header.th.textContent!.trim().toLowerCase();
    if (headerText in IGNORED_HEADERS) return NOOP_PARSER;
    const property = getPropertyForHeader(headerText, header.th);
    if (property) {
      const propertyType = COMMON_PROPERTY_TYPES[property];
      let parser: ValueParser<unknown> = COMMON_PARSERS[propertyType];
      return constructPropertyParser(property, parser);
    }
  }
}

export function constructPropertyParser(property: string, parser: ValueParser<unknown>): ICellParser {
  return {
    parse(td, item) {
      item[property] = parser(td);
    }
  };
}

function getPropertyForHeader(headerText: string, th: HTMLTableCellElement): string | undefined {
  let directMatch = COMMON_PROPERTY_HEADERS[headerText];
  if (directMatch) return directMatch;
  if (!headerText) {
    if (!!th.querySelector('img[alt="Autoswing"], img.auto-icon')) return 'autoSwing';
  }
}
