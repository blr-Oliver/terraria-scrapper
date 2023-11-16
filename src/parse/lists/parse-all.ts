import {EntryInfo} from '../../fetch/fetch-lists';
import {NormalizedItem} from '../common';
import {NOOP_PARSER_PROVIDER} from './cell-parsers';
import {CombiningItemDataCollector} from './collectors/CombiningItemDataCollector';
import {ItemListDocumentParser} from './ItemListDocumentParser';
import {ItemTableParser} from './ItemTableParser';
import {ListProcessor} from './ListProcessor';
import {BehaviorPropertiesProvider} from './providers/BehaviorPropertiesProvider';
import {BlastRadiusProvider} from './providers/BlastRadiusProvider';
import {CommonParserProvider} from './providers/CommonParserProvider';
import {CompositeParserProvider} from './providers/CompositeParserProvider';
import {NameBlockParserProvider} from './providers/NameBlockParserProvider';
import {WhipEffectParserProvider} from './providers/WhipEffectParserProvider';

export async function parseAll(entry: EntryInfo): Promise<{ [name: string]: NormalizedItem }> {
  const collector = new CombiningItemDataCollector();
  const parseProvider = new CompositeParserProvider(
      new CommonParserProvider(),
      new NameBlockParserProvider(),
      new WhipEffectParserProvider(),
      new BlastRadiusProvider(),
      new BehaviorPropertiesProvider(),
      NOOP_PARSER_PROVIDER);
  const tableParser = new ItemTableParser(parseProvider);
  const fileParser = new ItemListDocumentParser(tableParser);
  const processor = new ListProcessor(fileParser, collector);
  return processor.processLists(entry);
}