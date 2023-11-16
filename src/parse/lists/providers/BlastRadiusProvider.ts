import {parseString} from '../../common-parsers';
import {HeaderContext, ICellParser, ParserProvider} from '../cell-parsers';
import {constructPropertyParser} from './CommonParserProvider';

export class BlastRadiusProvider implements ParserProvider {
  getParser(header: HeaderContext): ICellParser | undefined {
    let caption = header.th.textContent!.trim().toLowerCase();
    if (caption.indexOf('blast radius') !== -1) {
      let propertyName = this.getPropertyName(header, caption);
      if (propertyName)
        return constructPropertyParser(propertyName, parseString);
    }
  }

  getPropertyName(header: HeaderContext, caption: string): string | undefined {
    if (caption.indexOf('normal') !== -1) return 'blastRadius'; // ammo item property
    // behavior properties
    if (caption.indexOf('liquid rocket') !== -1) return 'liquidRocketBlastRadius';
    if (caption.indexOf('cluster rocket') !== -1) return 'clusterRocketBlastRadius';
    if (caption.indexOf('mini nuke') !== -1) return 'miniNukeBlastRadius';
    if (caption.indexOf('rocket iii') !== -1) return 'bigRocketBlastRadius';
  }
}