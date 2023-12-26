export function sortKeys<T>(data: { [key: string]: T }) {
  let sorted = Object.keys(data).sort();
  let sortedData: { [name: string]: T } = {};
  for (let key of sorted)
    sortedData[key] = data[key];
  return sortedData;
}