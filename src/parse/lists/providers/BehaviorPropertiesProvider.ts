import {parseFlag} from '../../common-parsers';
import {HeaderContext, ICellParser} from '../cell-parsers';
import {ParserProvider} from '../parse-table';
import {constructPropertyParser} from './CommonParserProvider';

export class BehaviorPropertiesProvider implements ParserProvider {
  getParser(header: HeaderContext): ICellParser | undefined {
    let caption = header.th.textContent!.trim().toLowerCase();
    let section = header.table.section;
    if (section === 'behavior' && caption.endsWith('?')) {
      let propertyName = this.getPropertyName(header, caption);
      if (propertyName)
        return constructPropertyParser(propertyName, parseFlag);
    }
  }

  getPropertyName(header: HeaderContext, caption: string): string | undefined {
    if (caption.indexOf('destroy tiles') !== -1) return 'explosivesDestroyTiles';
    if (caption.indexOf('liquid rockets') !== -1) return 'liquidRocketsWork';
    if (caption.indexOf('cluster rocket') !== -1) return 'clusterRocketSecondaryExplosion';
  }

}