import {EntryInfo} from '../../execution';
import {ensureExists} from '../../fetch/common';
import {NOOP_PARSER_PROVIDER} from './cell-parsers';
import {SavingCollector} from './collectors/SavingCollector';
import {ItemListDocumentParser} from './ItemListDocumentParser';
import {ItemTableParser} from './ItemTableParser';
import {ListProcessor} from './ListProcessor';
import {AmmoNameBlockParserProvider} from './providers/AmmoNameBlockParserProvider';
import {BehaviorPropertiesProvider} from './providers/BehaviorPropertiesProvider';
import {BlastRadiusProvider} from './providers/BlastRadiusProvider';
import {CommonParserProvider} from './providers/CommonParserProvider';
import {CompositeParserProvider} from './providers/CompositeParserProvider';
import {IgnoreSectionProvider} from './providers/IgnoreSectionProvider';
import {RegularNameBlockParserProvider} from './providers/RegularNameBlockParserProvider';
import {WhipEffectParserProvider} from './providers/WhipEffectParserProvider';

export async function parseLists(entry: EntryInfo): Promise<void> {
  const collector = new SavingCollector(entry);
  const parseProvider = new CompositeParserProvider(
      new IgnoreSectionProvider({
        'Ammunition_items': [
          {name: 'bait'},
          {name: 'wire'}
        ]
      }),
      new AmmoNameBlockParserProvider(),
      new CommonParserProvider(),
      new RegularNameBlockParserProvider(),
      new WhipEffectParserProvider(),
      new BlastRadiusProvider(),
      new BehaviorPropertiesProvider(),
      NOOP_PARSER_PROVIDER);
  const tableParser = new ItemTableParser(parseProvider);
  const fileParser = new ItemListDocumentParser(tableParser);
  const processor = new ListProcessor(entry, fileParser, collector);
  await ensureExists(`${entry.out}/json/lists`);
  return processor.processLists();
}