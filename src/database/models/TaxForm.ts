import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class TaxForm extends Model {
  static table = 'tax_forms';

  @field('name') name!: string;
  @field('code') code!: string;
  @field('description') description!: string;
  @field('category') category!: string;
  @field('is_active') isActive!: boolean;
  @field('parameters') parameters!: string;
  @field('server_id') serverId!: string;
  @field('last_sync') lastSync!: number;
  @date('valid_from') validFrom!: Date;
  @date('valid_to') validTo!: Date;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('tax_rules') rules!: any;
}