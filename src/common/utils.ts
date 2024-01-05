export function sortKeys<T>(data: { [key: string]: T }) {
  let sorted = Object.keys(data).sort();
  let sortedData: { [name: string]: T } = {};
  for (let key of sorted)
    sortedData[key] = data[key];
  return sortedData;
}

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  return toOrderedJSON(a) === toOrderedJSON(b);
}

export function toOrderedJSON(x: any): string {
  return JSON.stringify(x, replaceForOrdered);
}

function replaceForOrdered(this: any, key: string, value: any): any {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value))
    return value.map(x => toOrderedJSON(x)).sort();
  return sortKeys(value);
}