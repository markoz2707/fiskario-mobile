import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import Company from './models/Company';
import Invoice from './models/Invoice';
import InvoiceItem from './models/InvoiceItem';
import Cost from './models/Cost';
import Declaration from './models/Declaration';
import SyncQueue from './models/SyncQueue';

const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment it out for development)
  // jsi: true, // experimental JSI mode for better performance
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    Company,
    Invoice,
    InvoiceItem,
    Cost,
    Declaration,
    SyncQueue,
  ],
});