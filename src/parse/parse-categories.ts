export interface ItemInCategory {
  name: string;
  href: string;
}

export interface Category {
  name: string;
  categories: Category[];
  items: ItemInCategory[];
}

export function parseCategoriesFromDom(document: Document): Category {
  const rootCategory: Category = {
    name: 'Weapons',
    categories: [],
    items: []
  }
  processFlatSections(
      rootCategory,
      document.querySelector('.mw-parser-output')!,
      ['.infocard', 'h2', 'h3', 'h4'],
      processInfoCard,
      extractTopLevelName);

  omitEmptyCategories(rootCategory);

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

/**
 * Recursively removes empty categories.
 *
 * @param root category to clean
 * @return true if passed category is empty
 */
function omitEmptyCategories(root: Category): boolean {
  for (let i = root.categories.length - 1; i >= 0; --i) {
    if (omitEmptyCategories(root.categories[i]))
      root.categories.splice(i, 1);
  }
  return !root.categories.length && !root.items.length;
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