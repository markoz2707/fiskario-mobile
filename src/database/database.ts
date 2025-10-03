import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import Company from './models/Company';
import Invoice from './models/Invoice';
import InvoiceItem from './models/InvoiceItem';
import Cost from './models/Cost';
import Declaration from './models/Declaration';
import SyncQueue from './models/SyncQueue';
import ZUSEmployee from './models/ZUSEmployee';
import ZUSRegistration from './models/ZUSRegistration';
import ZUSReport from './models/ZUSReport';
import ZUSContribution from './models/ZUSContribution';

const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment it out for development)
  // jsi: true, // experimental JSI mode for better performance
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

console.log('Database adapter created successfully');

export const database = new Database({
  adapter,
  modelClasses: [
    Company,
    Invoice,
    InvoiceItem,
    Cost,
    Declaration,
    SyncQueue,
    ZUSEmployee,
    ZUSRegistration,
    ZUSReport,
    ZUSContribution,
  ],
});