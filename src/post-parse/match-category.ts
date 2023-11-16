import {NormalizedItem} from '../parse/common';
import {Category} from '../parse/weapon-categories';
import {PlatformName} from '../platform-varying';

export function matchCategory(items: { [name: string]: NormalizedItem }, root: Category): void {
  matchRecursively(items, root, []);
}

function matchRecursively(items: { [p: string]: NormalizedItem }, category: Category, names: string[]) {
  if (category.items) {
    let snapshot = names.slice();
    for (let item of category.items) {
      let descriptor = items[item.name];
      if (descriptor) {
        for (let platform in descriptor) {
          descriptor[platform as PlatformName]!['category'] = snapshot;
        }
      } else
        console.warn(`Unknown item ${item.name}`);
    }
  }
  if (category.categories) {
    for (let child of category.categories) {
      names.push(child.name);
      matchRecursively(items, child, names);
      names.pop();
    }
  }
}
