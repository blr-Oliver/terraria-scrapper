import {HeaderContext, ICellParser, NOOP_PARSER, ParserProvider} from '../cell-parsers';

export interface SectionNameLocator {
  name: string;
}

export interface SectionIndexLocator {
  index: number;
}

export type SectionLocator = SectionNameLocator | SectionIndexLocator;

export class IgnoreSectionProvider implements ParserProvider {
  constructor(public ignore: { [fileKey: string]: SectionLocator[] }) {
  }

  getParser(header: HeaderContext): ICellParser | undefined {
    let fileSections = this.ignore[header.table.file];
    if (fileSections) {
      const index = header.table.sectionIndex;
      const name = header.table.section;
      if (fileSections.some(locator => {
        if (('index' in locator) && locator.index === index) return true;
        if (('name' in locator) && locator.name === name) return true;
        return false;
      })) {
        return NOOP_PARSER;
      }
    }
  }

}