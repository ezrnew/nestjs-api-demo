import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';

export const setupDataSource = async () => {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database',
  });

  db.public.registerFunction({
    implementation: () => 'PostgreSQL 12.4',
    name: 'version',
  });

  const ds: DataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    // entities: [Book,Author],
  });
  await ds.initialize();
  await ds.synchronize();

  return ds;
};
