import * as fs from 'fs';
import {JSDOM} from 'jsdom';
import {EntryInfo} from '../fetch/fetch-lists';

export async function collectAllTableCaptions(entry: EntryInfo): Promise<string[]> {
  let files: string[] = Array(entry.lists.length + 1);
  files[0] = `${entry.destRoot}/Global List.html`;
  for (let i = 0; i < entry.lists.length; ++i)
    files[i + 1] = `${entry.destRoot}/lists/${entry.lists[i]}.html`;

  let allCaptions: { [key: string]: true } = {};
  await Promise.all(files.map(file => collectTableCaptions(file, allCaptions)));
  return Object.keys(allCaptions).sort();
}

async function collectTableCaptions(file: string, allCaptions: { [key: string]: true }): Promise<void> {
  const content = await fs.promises.readFile(file, {encoding: 'utf8'});
  let document = new JSDOM(content).window.document;
  document
      .querySelectorAll<HTMLTableElement>('table.terraria.sortable')
      .forEach(table => extractCaptions(table, allCaptions));
}

function extractCaptions(table: HTMLTableElement, allCaptions: { [key: string]: true }): void {
  const headerRow = !!table.tHead ? table.tHead.rows[0] : table.tBodies[0].rows[0];
  const cellNum = headerRow.cells.length;
  for (let i = 0; i < cellNum; ++i)
    allCaptions[headerRow.cells[i].textContent!.trim()] = true;
}