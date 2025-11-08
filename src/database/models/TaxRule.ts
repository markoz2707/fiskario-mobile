import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class TaxRule extends Model {
  static table = 'tax_rules';

  @field('name') name!: string;
  @field('rule_type') ruleType!: string;
  @field('conditions') conditions!: string;
  @field('calculation_method') calculationMethod!: string;
  @field('value') value!: number;
  @field('min_base') minBase!: number;
  @field('max_base') maxBase!: number;
  @field('is_default') isDefault!: boolean;
  @field('priority') priority!: number;
  @field('is_active') isActive!: boolean;
  @field('server_id') serverId!: string;
  @field('last_sync') lastSync!: number;
  @date('valid_from') validFrom!: Date;
  @date('valid_to') validTo!: Date;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('tax_forms', 'tax_form_id') taxForm!: any;
}