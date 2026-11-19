import * as migration_20261117_184500_initial from './20261117_184500_initial';
import * as migration_20261118_131033_blob_storage_fields from './20261118_131033_blob_storage_fields';
import * as migration_20261119_134151_content_collections from './20261119_134151_content_collections';

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
    name: '20261119_134151_content_collections'
  },
];
