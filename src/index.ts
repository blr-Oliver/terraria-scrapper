import * as fs from 'fs';
import {getWeaponList} from './weapon-list';

getWeaponList().then(names => {
  fs.writeFileSync('out/out.json', JSON.stringify(names), {encoding: 'utf8'});
});