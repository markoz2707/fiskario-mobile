import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class CompanyTaxSettings extends Model {
  static table = 'company_tax_settings';

  @field('is_selected') isSelected!: boolean;
  @field('settings') settings!: string;
  @field('notes') notes!: string;
  @field('server_id') serverId!: string;
  @field('last_sync') lastSync!: number;
  @date('activated_at') activatedAt!: Date;
  @date('deactivated_at') deactivatedAt!: Date;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('companies', 'company_id') company!: any;
  @relation('tax_forms', 'tax_form_id') taxForm!: any;
}