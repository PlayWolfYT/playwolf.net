import * as migration_20260731_112904 from './20260731_112904';
import * as migration_20260731_114504 from './20260731_114504';

export const migrations = [
  {
    up: migration_20260731_112904.up,
    down: migration_20260731_112904.down,
    name: '20260731_112904',
  },
  {
    up: migration_20260731_114504.up,
    down: migration_20260731_114504.down,
    name: '20260731_114504'
  },
];
