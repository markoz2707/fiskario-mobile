import { Model } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';

export default class Customer extends Model {
  static table = 'customers';

  @field('name') name!: string;
  @field('nip') nip!: string;
  @field('address') address!: string;
  @field('city') city!: string;
  @field('postal_code') postalCode!: string;
  @field('country') country!: string;
  @field('email') email!: string;
  @field('phone') phone!: string;
  @field('is_active') isActive!: boolean;
  @field('payment_terms') paymentTerms!: number; // days
  @field('notes') notes!: string;
  @field('server_id') serverId!: string;
  @field('last_sync') lastSync!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('companies', 'company_id') company!: any;
  @children('invoices') invoices!: any[];
}