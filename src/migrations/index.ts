import * as migration_20260731_112904 from './20260731_112904';
import * as migration_20260731_114504 from './20260731_114504';
import * as migration_20260801_142319_maintenance_excluded_paths from './20260801_142319_maintenance_excluded_paths';
import * as migration_20260803_093124_artwork_subject_featuring from './20260803_093124_artwork_subject_featuring';
import * as migration_20260810_173959_artwork_wip_commissions_notifications from './20260810_173959_artwork_wip_commissions_notifications';
import * as migration_20260811_191914_croppable_image_collections from './20260811_191914_croppable_image_collections';

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
    name: '20260801_142319_maintenance_excluded_paths',
  },
  {
    up: migration_20260803_093124_artwork_subject_featuring.up,
    down: migration_20260803_093124_artwork_subject_featuring.down,
    name: '20260803_093124_artwork_subject_featuring',
  },
  {
    up: migration_20260810_173959_artwork_wip_commissions_notifications.up,
    down: migration_20260810_173959_artwork_wip_commissions_notifications.down,
    name: '20260810_173959_artwork_wip_commissions_notifications',
  },
  {
    up: migration_20260811_191914_croppable_image_collections.up,
    down: migration_20260811_191914_croppable_image_collections.down,
    name: '20260811_191914_croppable_image_collections'
  },
];
