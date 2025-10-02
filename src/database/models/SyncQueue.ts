import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class SyncQueue extends Model {
  static table = 'sync_queue';

  @field('table_name') tableName!: string;
  @field('record_id') recordId!: string;
  @field('operation') operation!: string;
  @field('data') data!: string;
  @field('status') status!: string;
  @field('error_message') errorMessage!: string;
  @field('retry_count') retryCount!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}