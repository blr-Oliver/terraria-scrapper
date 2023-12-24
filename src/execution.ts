import * as fs from 'fs';
import {OPERATION_ORDER, OperationNames, OPERATIONS} from './operations';

export type OperationConfig = {
  enabled: boolean,
  prompt?: string,
  pause: boolean
}

export type Config = {
  entry: string,
  operations: { [opName in OperationNames]: OperationConfig },
}

export interface EntryInfo {
  htmlRootUrl: string;
  htmlEntrySuffix: string;
  out: string;
  categories: string;
  lists: string[];
  excludeCards: string[];
}

export async function executeRoutine<T extends (...args: any) => any>(
    routine: T, prompt: string | undefined, awaitKeyPress: boolean,
    ...params: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
  if (prompt)
    console.log(prompt);
  if (awaitKeyPress) {
    console.log('Press any key to continue');
    await keypress();
  }
  let result = await Promise.resolve(routine(...(params as any[])));
  if (prompt || awaitKeyPress)
    console.log('Done');
  return result;
}

async function keypress(): Promise<void> {
  process.stdin.setRawMode(true);

  return new Promise(resolve => {
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

async function loadEntry(path = 'src/entry.json'): Promise<EntryInfo> {
  let content = await fs.promises.readFile(path, {encoding: 'utf8'});
  return JSON.parse(content);
}

export class Execution {
  constructor(private config: Config) {
  }

  async run(): Promise<void> {
    const entry = await loadEntry(this.config.entry);
    let enabledTasks = OPERATION_ORDER
        .filter(opName => this.config.operations[opName]?.enabled)
    for (let task of enabledTasks) {
      await executeRoutine(OPERATIONS[task]!, this.config.operations[task]?.prompt || task, this.config.operations[task]?.pause, entry);
    }
  }
}

