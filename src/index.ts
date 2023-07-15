import * as fs from 'fs';
import {getWeaponList} from './weapon-list';

async function keypress(): Promise<void> {
  process.stdin.setRawMode(true);

  return new Promise(resolve => {
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

async function executeProgram(): Promise<void> {
  console.log('Press any key to continue');
  await keypress();
  let weapons = await getWeaponList();
  fs.writeFileSync('out/out.json', JSON.stringify(weapons), {encoding: 'utf8'});
}
executeProgram().then(() => process.exit(0));
