import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class ZUSReport extends Model {
  static table = 'zus_reports';

  @field('report_type') reportType!: string;
  @field('period') period!: string;
  @date('report_date') reportDate!: Date;
  @field('total_employees') totalEmployees!: number;
  @field('total_contributions') totalContributions!: number;
  @field('status') status!: string;
  @field('zus_reference_number') zusReferenceNumber?: string;
  @field('upo_number') upoNumber?: string;
  @date('upo_date') upoDate?: Date;
  @field('company_id') companyId!: string;
  @field('data') data!: string;
  @field('server_id') serverId?: string;
  @date('last_sync') lastSync?: Date;

  @children('zus_contributions') contributions!: any;
}