import {HeaderContext} from '../cell-parsers';
import {NameBlockParserProvider} from './NameBlockParserProvider';

export class RegularNameBlockParserProvider extends NameBlockParserProvider {
  constructor() {
    super('a[href][title]');
  }

  protected isNameBlock(caption: string, header: HeaderContext): boolean {
    return caption === 'name' || caption === 'item';
  }
}