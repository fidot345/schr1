import * as migration_20261117_184500_initial from './20261117_184500_initial';
import * as migration_20261118_131033_blob_storage_fields from './20261118_131033_blob_storage_fields';
import * as migration_20261119_134151_content_collections from './20261119_134151_content_collections';
import * as migration_20261119_174831_site_settings_home_page from './20261119_174831_site_settings_home_page';
import * as migration_20261120_154509_site_settings_logo_word from './20261120_154509_site_settings_logo_word';
import * as migration_20261122_124736_home_page_blocks_and_tagline from './20261122_124736_home_page_blocks_and_tagline';

export const migrations = [
  {
    up: migration_20261117_184500_initial.up,
    down: migration_20261117_184500_initial.down,
    name: '20261117_184500_initial',
  },
  {
    up: migration_20261118_131033_blob_storage_fields.up,
    down: migration_20261118_131033_blob_storage_fields.down,
    name: '20261118_131033_blob_storage_fields',
  },
  {
    up: migration_20261119_134151_content_collections.up,
    down: migration_20261119_134151_content_collections.down,
    name: '20261119_134151_content_collections',
  },
  {
    up: migration_20261119_174831_site_settings_home_page.up,
    down: migration_20261119_174831_site_settings_home_page.down,
    name: '20261119_174831_site_settings_home_page',
  },
  {
    up: migration_20261120_154509_site_settings_logo_word.up,
    down: migration_20261120_154509_site_settings_logo_word.down,
    name: '20261120_154509_site_settings_logo_word',
  },
  {
    up: migration_20261122_124736_home_page_blocks_and_tagline.up,
    down: migration_20261122_124736_home_page_blocks_and_tagline.down,
    name: '20261122_124736_home_page_blocks_and_tagline'
  },
];
