import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class Company extends Model {
  static table = 'companies';

  @field('name') name!: string;
  @field('nip') nip!: string;
  @field('regon') regon!: string;
  @field('street') street!: string;
  @field('city') city!: string;
  @field('postal_code') postalCode!: string;
  @field('country') country!: string;
  @field('vat_status') vatStatus!: string;
  @field('tax_office') taxOffice!: string;
  @field('is_active') isActive!: boolean;
  @field('server_id') serverId!: string;
  @field('last_sync') lastSync!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}