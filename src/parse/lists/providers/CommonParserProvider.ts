import {ItemCard} from '../../../common/types';
import {COMMON_PARSERS, ValueParser} from '../../common-parsers';
import {COMMON_PROPERTY_HEADERS, COMMON_PROPERTY_TYPES, IGNORED_HEADERS} from '../../known-constants';
import {HeaderContext, ICellParser, ICellPropertyParser, NOOP_PARSER, ParserProvider} from '../cell-parsers';

export class CommonParserProvider implements ParserProvider {
  getParser(header: HeaderContext): ICellParser | undefined {
    const headerText = header.th.textContent!.trim().toLowerCase();
    if (headerText in IGNORED_HEADERS) return NOOP_PARSER;
    const property: keyof ItemCard | undefined = getPropertyForHeader(headerText, header.th);
    if (property) {
      let parser = COMMON_PARSERS[COMMON_PROPERTY_TYPES[property]!];
      return constructPropertyParser(property, parser);
    }
  }
}

export function constructPropertyParser<K extends keyof ItemCard>(property: K, parser: ValueParser<ItemCard[K]>): ICellPropertyParser {
  return {
    property,
    parse(td, item, context) {
      // @ts-ignore
      item[property] = parser(td, context.platforms);
    }
  };
}

function getPropertyForHeader(headerText: string, th: HTMLTableCellElement): keyof ItemCard | undefined {
  let directMatch = COMMON_PROPERTY_HEADERS[headerText];
  if (directMatch) return directMatch;
  if (!headerText) {
    if (!!th.querySelector('img[alt="Autoswing"], img.auto-icon')) return 'autoSwing';
  }
}
