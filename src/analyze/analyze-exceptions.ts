import * as fs from 'fs';
import {CardParsingException} from '../parse/parse-item';

type ExceptionStats = {
  ex: CardParsingException;
  files: string[];
}

export function mergeExceptions(): ExceptionStats[] {
  let files = fs.readdirSync('out/cards', {encoding: 'utf8'});
  let merged = processFiles(files);
  return [...merged.values()];
}

function processFiles(files: string[]): Map<string, ExceptionStats> {
  let merged: Map<string, ExceptionStats> = new Map<string, ExceptionStats>();

  for (let file of files) {
    if (file.endsWith('.json')) {
      let exceptions = getExceptions(file);
      if (!exceptions) continue;
      for (let ex of exceptions) {
        let hash = getExceptionKey(ex);
        if (!merged.has(hash.key)) {
          merged.set(hash.key, {
            ex: hash.value,
            files: []
          });
        }
        merged.get(hash.key)!.files.push(file.slice(0, -5));
      }
    }
  }

  return merged;
}

type HashedException = {
  key: string,
  value: CardParsingException
}

function getExceptions(file: string): CardParsingException[] | undefined {
  let content = fs.readFileSync(`out/cards/${file}`, {encoding: 'utf8'});
  let data: any;
  try {
    data = JSON.parse(content);
  } catch (ex) {
    console.error(ex);
    return;
  }
  if (data && data.parsingExceptions)
    return data.parsingExceptions as CardParsingException[];
}

function getExceptionKey(ex: CardParsingException): HashedException {
  const key = [ex.stage, ex.message, JSON.stringify(ex.value || '')].join('|');
  return {
    key,
    value: ex
  };
}
