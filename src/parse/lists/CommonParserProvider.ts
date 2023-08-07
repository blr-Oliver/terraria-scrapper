import {CellParser, HeaderContext, NOOP_PARSER} from './cell-parsers';
import {COMMON_PARSERS, ValueParser} from '../common-parsers';
import {COMMON_PROPERTY_HEADERS, COMMON_PROPERTY_TYPES, IGNORED_HEADERS} from './known-constants';
import {ParserProvider} from './parse-table';

export class CommonParserProvider implements ParserProvider {
  getParser(header: HeaderContext): CellParser | undefined {
    const headerText = header.th.textContent!.trim().toLowerCase();
    if (headerText in IGNORED_HEADERS) return NOOP_PARSER;
    const property = COMMON_PROPERTY_HEADERS[headerText];
    if (property) {
      const propertyType = COMMON_PROPERTY_TYPES[property];
      let parser: ValueParser<unknown> = COMMON_PARSERS[propertyType];
      return constructPropertyParser(property, parser);
    }
  }
}

function constructPropertyParser(property: string, parser: ValueParser<unknown>): CellParser {
  return (td, item) => item[property] = parser(td);
}