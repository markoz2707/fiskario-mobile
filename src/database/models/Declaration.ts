import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class Declaration extends Model {
  static table = 'declarations';

  @field('type') type!: string;
  @field('period') period!: string;
  @field('year') year!: number;
  @field('status') status!: string;
  @field('company_id') companyId!: string;
  @field('data') data!: string;
  @field('submission_id') submissionId!: string;
  @field('submitted_at') submittedAt!: number;
  @field('server_id') serverId!: string;
  @field('last_sync') lastSync!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('companies', 'company_id') company!: any;
}