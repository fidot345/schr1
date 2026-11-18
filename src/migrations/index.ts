import * as migration_20261117_184500_initial from './20261117_184500_initial';
import * as migration_20261118_131033_blob_storage_fields from './20261118_131033_blob_storage_fields';

export const migrations = [
  {
    up: migration_20261117_184500_initial.up,
    down: migration_20261117_184500_initial.down,
    name: '20261117_184500_initial',
  },
  {
    up: migration_20261118_131033_blob_storage_fields.up,
    down: migration_20261118_131033_blob_storage_fields.down,
    name: '20261118_131033_blob_storage_fields'
  },
];
