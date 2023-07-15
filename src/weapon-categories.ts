import * as JSDOM from 'jsdom';
import {fetchHtmlRaw} from './fetch';

export interface ItemInCategory {
  name: string;
  href: string;
}

export interface Category {
  name: string;
  categories: Category[];
  items: ItemInCategory[];
}

export async function getWeaponCategories(): Promise<Category> {
  let rootText = await fetchHtmlRaw('https://terraria.wiki.gg/wiki/Weapons');
  let rootDoc: Document = (new JSDOM.JSDOM(rootText)).window.document;
  const rootCategory: Category = {
    name: 'Weapons',
    categories: [],
    items: []
  }
  processFlatSections(
      rootCategory,
      rootDoc.querySelector('.mw-parser-output')!,
      ['.infocard', 'h2', 'h3', 'h4'],
      processInfoCard,
      extractTopLevelName);
  return rootCategory;
}

function processFlatSections(root: Category,
                             container: Element,
                             selectors: string[],
                             processContent: (category: Category, section: Element) => void,
                             extractName: (section: Element) => string) {
  const sections = ([...container.children] as Element[])
      .filter(section => selectors
          .some(selector => section.matches(selector)));

  let category: Category = root;
  let categoryStack: Category[] = [category];
  for (let section of sections) {
    if (section.matches(selectors[0])) {
      processContent(category, section);
    } else {
      const newLevel = selectors.findIndex(selector => section.matches(selector));
      while (categoryStack.length > newLevel) {
        categoryStack.pop();
        category = categoryStack.at(-1)!;
      }
      const newCategory: Category = {
        name: extractName(section),
        categories: [],
        items: []
      };
      category.categories.push(newCategory);
      categoryStack.push(newCategory);
      category = newCategory;
    }
  }
}

function extractTopLevelName(section: Element): string {
  return section.querySelector('.mw-headline')!.textContent!.trim();
}
function extractInfoCardName(section: Element): string {
  return section.textContent!.trim();
}

function processInfoCard(category: Category, container: Element) {
  processFlatSections(
      category,
      container.querySelector('.outro')!,
      ['.itemlist', '.main-heading', '.heading'],
      processItemList,
      extractInfoCardName);
}

function processItemList(category: Category, container: Element) {
  category.items = [...container.querySelector('ul')!.children]
      .filter(element => element.matches('li'))
      .map(extractItem);
}

function extractItem(li: Element): ItemInCategory {
  const a = li.querySelector<HTMLAnchorElement>('span span span a')!;
  return {
    name: a.textContent!.trim(),
    href: a.href
  };
}