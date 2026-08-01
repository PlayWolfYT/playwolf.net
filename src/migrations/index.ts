import * as migration_20260731_112904 from './20260731_112904';
import * as migration_20260731_114504 from './20260731_114504';
import * as migration_20260801_142319_maintenance_excluded_paths from './20260801_142319_maintenance_excluded_paths';

export const migrations = [
  {
    up: migration_20260731_112904.up,
    down: migration_20260731_112904.down,
    name: '20260731_112904',
  },
  {
    up: migration_20260731_114504.up,
    down: migration_20260731_114504.down,
    name: '20260731_114504',
  },
  {
    up: migration_20260801_142319_maintenance_excluded_paths.up,
    down: migration_20260801_142319_maintenance_excluded_paths.down,
    name: '20260801_142319_maintenance_excluded_paths'
  },
];
