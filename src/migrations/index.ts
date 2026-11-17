import * as migration_20261117_184500_initial from "./20261117_184500_initial";

export const migrations = [
  {
    up: migration_20261117_184500_initial.up,
    down: migration_20261117_184500_initial.down,
    name: "20261117_184500_initial",
  },
];
