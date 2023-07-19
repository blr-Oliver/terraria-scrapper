import * as fs from 'fs';
import {pullToTop} from './platform-varying';
import {getWeaponInfo, WeaponInfo} from './weapon-card';
import {getWeaponCategories} from './weapon-categories';
import {getWeaponList} from './weapon-info';

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
//  await loadWeaponList();
//  await loadWeaponCategories();
  await loadSingleWeapon('/wiki/Katana');
}

async function loadWeaponCategories() {
  console.log('Loading weapon categories...');
  console.log('Press any key to continue');
  await keypress();
  let weaponCategories = await getWeaponCategories();
  console.log('Saving...');
  fs.writeFileSync('out/weapon-categories.json', JSON.stringify(weaponCategories, null, 2), {encoding: 'utf8'});
  console.log('Done');
}

async function loadWeaponList(): Promise<void> {
  console.log('Loading weapon list...');
  console.log('Press any key to continue');
  await keypress();
  let weapons = await getWeaponList();
  console.log('Saving...');
  fs.writeFileSync('out/weapon-list.json', JSON.stringify(weapons, null, 2), {encoding: 'utf8'});
  console.log('Done');
}

async function loadSingleWeapon(path: string): Promise<void> {
  console.log(`Loading weapon from '${path}' ...`);
  console.log('Press any key to continue');
  await keypress();
  let weaponInfo = await getWeaponInfo(path);
  console.log('Collapsing...');
  const platforms = weaponInfo.platforms;
  delete weaponInfo.platforms;
  let collapsed = pullToTop<WeaponInfo>(weaponInfo, platforms);
  console.log('Saving...');
  fs.writeFileSync('out/weapon-single.json', JSON.stringify(collapsed, null, 2), {encoding: 'utf8'});
  console.log('Done');
}

executeProgram().then(() => process.exit(0));
