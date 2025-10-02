import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class Cost extends Model {
  static table = 'costs';

  @field('name') name!: string;
  @field('description') description!: string;
  @field('amount') amount!: number;
  @field('category') category!: string;
  @field('date') date!: number;
  @field('company_id') companyId!: string;
  @field('receipt_path') receiptPath!: string;
  @field('ocr_data') ocrData!: string;
  @field('server_id') serverId!: string;
  @field('last_sync') lastSync!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('companies', 'company_id') company!: any;
}