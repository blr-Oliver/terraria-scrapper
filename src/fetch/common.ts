import * as fs from 'fs';
import * as path from 'path';

export async function ensureExists(dirPath: string): Promise<void> {
  return fs.promises.mkdir(path.normalize(dirPath), {recursive: true}).then();
}

export function writeFile(file: string, content: string): Promise<void> {
  return fs.promises.writeFile(`${file}`, content, {encoding: 'utf8'});
}