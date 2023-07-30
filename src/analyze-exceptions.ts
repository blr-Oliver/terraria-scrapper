import * as fs from 'fs';
import {ParsingException} from './weapon-card';

type ExceptionStats = {
  ex: ParsingException;
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
  value: ParsingException
}

function getExceptions(file: string): ParsingException[] | undefined {
  let content = fs.readFileSync(`out/cards/${file}`, {encoding: 'utf8'});
  let data: any;
  try {
    data = JSON.parse(content);
  } catch (ex) {
    console.error(ex);
    return;
  }
  if (data && data.parsingExceptions)
    return data.parsingExceptions as ParsingException[];
}

function getExceptionKey(ex: ParsingException): HashedException {
  const key = [ex.stage, ex.description, JSON.stringify(ex.value || '')].join('|');
  return {
    key,
    value: ex
  };
}
