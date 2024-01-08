import * as fs from 'fs';
import {Config, Execution} from './execution';

async function loadConfig(path = 'data/config.json'): Promise<Config> {
  let content = await fs.promises.readFile(path, {encoding: 'utf8'});
  return JSON.parse(content);
}

async function run() {
  let config = await loadConfig();
  await new Execution(config).run();
}

run().then(
    () => process.exit(0)
)
