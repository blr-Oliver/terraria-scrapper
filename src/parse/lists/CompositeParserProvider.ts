import {CellParser, HeaderContext} from './cell-parsers';
import {ParserProvider} from './parse-table';

export class CompositeParserProvider implements ParserProvider {
  private readonly providers: ParserProvider[];

  constructor(...providers: ParserProvider[]) {
    this.providers = providers;
  }

  getParser(header: HeaderContext): CellParser | undefined {
    for (let provider of this.providers) {
      let parser = provider.getParser(header);
      if (parser) return parser;
    }
  }
}