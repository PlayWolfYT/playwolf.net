import * as migration_20260731_112904 from './20260731_112904';
import * as migration_20260731_114504 from './20260731_114504';
import * as migration_20260801_142319_maintenance_excluded_paths from './20260801_142319_maintenance_excluded_paths';
import * as migration_20260803_093124_artwork_subject_featuring from './20260803_093124_artwork_subject_featuring';
import * as migration_20260810_173959_artwork_wip_commissions_notifications from './20260810_173959_artwork_wip_commissions_notifications';
import * as migration_20260811_191914_croppable_image_collections from './20260811_191914_croppable_image_collections';
import * as migration_20260811_201308_framed_upload_sizes from './20260811_201308_framed_upload_sizes';
import * as migration_20260812_005200_framed_crop_source from './20260812_005200_framed_crop_source';
import * as migration_20260812_105447_alt_versions from './20260812_105447_alt_versions';
import * as migration_20260813_141500_twitch_youtube_link_kinds from './20260813_141500_twitch_youtube_link_kinds';

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
    name: '20260811_191914_croppable_image_collections',
  },
  {
    up: migration_20260811_201308_framed_upload_sizes.up,
    down: migration_20260811_201308_framed_upload_sizes.down,
    name: '20260811_201308_framed_upload_sizes',
  },
  {
    up: migration_20260812_005200_framed_crop_source.up,
    down: migration_20260812_005200_framed_crop_source.down,
    name: '20260812_005200_framed_crop_source',
  },
  {
    up: migration_20260812_105447_alt_versions.up,
    down: migration_20260812_105447_alt_versions.down,
    name: '20260812_105447_alt_versions'
  },
  {
    up: migration_20260813_141500_twitch_youtube_link_kinds.up,
    down: migration_20260813_141500_twitch_youtube_link_kinds.down,
    name: '20260813_141500_twitch_youtube_link_kinds',
  },
];
